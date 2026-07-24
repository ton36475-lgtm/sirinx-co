#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'
umask 077

# This harness is deliberately self-contained. It never sources .env files or
# accepts caller-supplied database URLs; both URLs are constructed from the
# unique, labelled container created below.

readonly MIN_FREE_KIB=$((15 * 1024 * 1024))
readonly OWNER_ROLE="sirinx_agent_runtime_owner"
readonly APP_ROLE="sirinx_agent_runtime_app"
readonly HARNESS_LABEL="com.sirinx.harness=agent-runtime-postgres"
readonly DISPOSABLE_LABEL="com.sirinx.disposable=true"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd -P)"
MIGRATIONS_DIR="${REPO_ROOT}/crates/sirinx-store/migrations"
ROLE_FIXTURE="${REPO_ROOT}/crates/sirinx-store/tests/fixtures/agent_runtime_roles.sql"

random_hex() {
    local byte_count="$1"
    od -An -N "${byte_count}" -tx1 /dev/urandom | tr -d ' \n'
}

RUN_ID="$(random_hex 8)"
readonly RUN_ID
CONTAINER_NAME="sirinx-agent-runtime-pg-${RUN_ID}"
NETWORK_NAME="sirinx-agent-runtime-net-${RUN_ID}"
MIGRATOR_LOGIN="sirinx_agent_runtime_migrator_${RUN_ID}"
RUNTIME_LOGIN="sirinx_agent_runtime_login_${RUN_ID}"
EMPTY_DATABASE="sirinx_agent_runtime_empty_${RUN_ID}"
PRIOR_DATABASE="sirinx_agent_runtime_prior_${RUN_ID}"
readonly CONTAINER_NAME NETWORK_NAME MIGRATOR_LOGIN RUNTIME_LOGIN
readonly EMPTY_DATABASE PRIOR_DATABASE

POSTGRES_IMAGE="${TEST_AGENT_RUNTIME_POSTGRES_IMAGE:-}"
TEST_TARGET="${TEST_AGENT_RUNTIME_TEST_TARGET:-agent_runtime_rls}"
TEST_NAME="${TEST_AGENT_RUNTIME_TEST_NAME:-agent_runtime_postgres_disposable}"
RLS_MIGRATION_BASENAME="${TEST_AGENT_RUNTIME_RLS_MIGRATION_FILE:-0006_agent_runtime_runtime_access.sql}"
KEEP_VALUE="${KEEP:-0}"
EVIDENCE_PATH="${REPO_ROOT}/reports/runtime/agent-runtime-postgres-disposable-${RUN_ID}.json"
TEST_SOURCE="${REPO_ROOT}/crates/sirinx-store/tests/${TEST_TARGET}.rs"
RLS_MIGRATION="${MIGRATIONS_DIR}/${RLS_MIGRATION_BASENAME}"
readonly POSTGRES_IMAGE TEST_TARGET TEST_NAME RLS_MIGRATION_BASENAME KEEP_VALUE
readonly EVIDENCE_PATH TEST_SOURCE RLS_MIGRATION

CANDIDATE_FILES=(
    "Cargo.toml"
    "Cargo.lock"
    "crates/sirinx-core/Cargo.toml"
    "crates/sirinx-core/src/agent_runtime.rs"
    "crates/sirinx-store/Cargo.toml"
    "crates/sirinx-store/src/lib.rs"
    "crates/sirinx-store/src/postgres.rs"
    "crates/sirinx-store/src/agent_runtime.rs"
    "crates/sirinx-store/tests/${TEST_TARGET}.rs"
    "crates/sirinx-store/tests/fixtures/agent_runtime_roles.sql"
    "crates/sirinx-store/migrations/0001_web_leads_and_events.sql"
    "crates/sirinx-store/migrations/0002_pending_work.sql"
    "crates/sirinx-store/migrations/0003_control_gates.sql"
    "crates/sirinx-store/migrations/0004_failure_lessons.sql"
    "crates/sirinx-store/migrations/0005_agent_runtime_core.sql"
    "crates/sirinx-store/migrations/${RLS_MIGRATION_BASENAME}"
    "scripts/test-agent-runtime-postgres.sh"
)
readonly CANDIDATE_FILES

CONTAINER_ID=""
NETWORK_CREATED="false"
TEMP_DIR=""
ADMIN_PASSWORD_FILE=""
PORT=""
IMAGE_ID=""
REPO_HEAD="unknown"
FREE_KIB_OBSERVED="null"
MIGRATION_0001_SHA="unknown"
MIGRATION_0002_SHA="unknown"
MIGRATION_0003_SHA="unknown"
MIGRATION_0004_SHA="unknown"
MIGRATION_0005_SHA="unknown"
RLS_MIGRATION_SHA="unknown"
CANDIDATE_MANIFEST_SHA="unknown"
CANDIDATE_CLEAN="false"
EMPTY_RESULT="NOT_RUN"
PRIOR_RESULT="NOT_RUN"
EMPTY_EXIT="null"
PRIOR_EXIT="null"
FINAL_VERDICT="HOLD"
FAIL_CODE="PRECHECK_NOT_COMPLETE"
CLEANUP_RESULT="NOT_STARTED"
STARTED_AT="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

log() {
    printf '[agent-runtime-postgres] %s\n' "$*"
}

die() {
    FAIL_CODE="$1"
    shift
    printf '[agent-runtime-postgres] HOLD %s\n' "$*" >&2
    exit 1
}

require_command() {
    command -v "$1" >/dev/null 2>&1 || die "MISSING_COMMAND" "required local command is absent: $1"
}

read_free_kib() {
    local observed
    observed="$(df -Pk "${REPO_ROOT}" | awk 'NR == 2 { print $4 }')"
    [[ "${observed}" =~ ^[0-9]+$ ]] || die "DISK_PROBE_INVALID" "free-disk probe did not return an integer"
    FREE_KIB_OBSERVED="${observed}"
}

assert_resource_gate() {
    local available
    read_free_kib
    available="${FREE_KIB_OBSERVED}"
    if (( available < MIN_FREE_KIB )); then
        die "RESOURCE_GATE_LT_15_GIB" "at least 15 GiB free is required; no Docker, Cargo, or database action was admitted"
    fi
}

sha256_file() {
    shasum -a 256 "$1" | awk '{ print $1 }'
}

candidate_manifest_sha() {
    local relative_path
    for relative_path in "${CANDIDATE_FILES[@]}"; do
        printf '%s  %s\n' "$(sha256_file "${REPO_ROOT}/${relative_path}")" "${relative_path}"
    done | shasum -a 256 | awk '{ print $1 }'
}

container_has_exact_labels() {
    local disposable run_label harness
    disposable="$(docker container inspect --format '{{ index .Config.Labels "com.sirinx.disposable" }}' "$1" 2>/dev/null || true)"
    run_label="$(docker container inspect --format '{{ index .Config.Labels "com.sirinx.run-id" }}' "$1" 2>/dev/null || true)"
    harness="$(docker container inspect --format '{{ index .Config.Labels "com.sirinx.harness" }}' "$1" 2>/dev/null || true)"
    [[ "${disposable}" == "true" && "${run_label}" == "${RUN_ID}" && "${harness}" == "agent-runtime-postgres" ]]
}

network_has_exact_labels() {
    local disposable run_label harness
    disposable="$(docker network inspect --format '{{ index .Labels "com.sirinx.disposable" }}' "$1" 2>/dev/null || true)"
    run_label="$(docker network inspect --format '{{ index .Labels "com.sirinx.run-id" }}' "$1" 2>/dev/null || true)"
    harness="$(docker network inspect --format '{{ index .Labels "com.sirinx.harness" }}' "$1" 2>/dev/null || true)"
    [[ "${disposable}" == "true" && "${run_label}" == "${RUN_ID}" && "${harness}" == "agent-runtime-postgres" ]]
}

cleanup_resources() {
    local cleanup_failed="false"
    local resource_seen="false"
    local candidate="${CONTAINER_ID}"

    if [[ "${KEEP_VALUE}" == "1" && ( -n "${CONTAINER_ID}" || "${NETWORK_CREATED}" == "true" ) ]]; then
        CLEANUP_RESULT="KEPT_EXPLICITLY"
        log "KEEP=1: retained exact disposable container ${CONTAINER_NAME} and its internal network"
        return 0
    fi

    if [[ -z "${candidate}" ]] && docker container inspect "${CONTAINER_NAME}" >/dev/null 2>&1; then
        candidate="${CONTAINER_NAME}"
    fi

    if [[ -n "${candidate}" ]]; then
        resource_seen="true"
        if container_has_exact_labels "${candidate}"; then
            if ! docker container rm --force "${candidate}" >/dev/null 2>&1; then
                cleanup_failed="true"
            fi
        else
            cleanup_failed="true"
            log "cleanup refused: candidate container did not carry this run's exact disposable labels"
        fi
    fi

    if [[ "${NETWORK_CREATED}" == "true" ]] || docker network inspect "${NETWORK_NAME}" >/dev/null 2>&1; then
        resource_seen="true"
        if network_has_exact_labels "${NETWORK_NAME}"; then
            if ! docker network rm "${NETWORK_NAME}" >/dev/null 2>&1; then
                cleanup_failed="true"
            fi
        else
            cleanup_failed="true"
            log "cleanup refused: candidate network did not carry this run's exact disposable labels"
        fi
    fi

    if [[ "${cleanup_failed}" == "true" ]]; then
        CLEANUP_RESULT="FAILED_SAFE_NO_BROAD_DELETE"
        return 1
    fi

    if [[ "${resource_seen}" == "true" ]]; then
        CLEANUP_RESULT="REMOVED_EXACT_LABELLED_RESOURCES"
    else
        CLEANUP_RESULT="NO_RESOURCES_CREATED"
    fi
    return 0
}

remove_secret_material() {
    if [[ -n "${ADMIN_PASSWORD_FILE}" && -f "${ADMIN_PASSWORD_FILE}" ]]; then
        : >"${ADMIN_PASSWORD_FILE}"
        rm -f -- "${ADMIN_PASSWORD_FILE}"
    fi
    if [[ -n "${TEMP_DIR}" && -d "${TEMP_DIR}" ]]; then
        rmdir -- "${TEMP_DIR}" 2>/dev/null || true
    fi
}

write_evidence() {
    local finished_at
    finished_at="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    {
        printf '{\n'
        printf '  "schemaVersion": "agent-runtime-postgres-evidence/1",\n'
        printf '  "runId": "%s",\n' "${RUN_ID}"
        printf '  "startedAt": "%s",\n' "${STARTED_AT}"
        printf '  "finishedAt": "%s",\n' "${finished_at}"
        printf '  "repoHead": "%s",\n' "${REPO_HEAD}"
        printf '  "candidateClean": %s,\n' "${CANDIDATE_CLEAN}"
        printf '  "candidateManifestSha256": "%s",\n' "${CANDIDATE_MANIFEST_SHA}"
        printf '  "postgresImageId": "%s",\n' "${IMAGE_ID}"
        printf '  "freeDiskThresholdKiB": %s,\n' "${MIN_FREE_KIB}"
        printf '  "freeDiskObservedKiB": %s,\n' "${FREE_KIB_OBSERVED}"
        printf '  "networkPolicy": "docker-internal-plus-loopback-only",\n'
        printf '  "cargoNetwork": "offline",\n'
        printf '  "migrationDigests": {\n'
        printf '    "0001_web_leads_and_events.sql": "%s",\n' "${MIGRATION_0001_SHA}"
        printf '    "0002_pending_work.sql": "%s",\n' "${MIGRATION_0002_SHA}"
        printf '    "0003_control_gates.sql": "%s",\n' "${MIGRATION_0003_SHA}"
        printf '    "0004_failure_lessons.sql": "%s",\n' "${MIGRATION_0004_SHA}"
        printf '    "0005_agent_runtime_core.sql": "%s",\n' "${MIGRATION_0005_SHA}"
        printf '    "%s": "%s"\n' "${RLS_MIGRATION_BASENAME}" "${RLS_MIGRATION_SHA}"
        printf '  },\n'
        printf '  "test": { "target": "%s", "name": "%s" },\n' "${TEST_TARGET}" "${TEST_NAME}"
        printf '  "scenarios": {\n'
        printf '    "empty": { "result": "%s", "exitCode": %s },\n' "${EMPTY_RESULT}" "${EMPTY_EXIT}"
        printf '    "prior-state": { "result": "%s", "exitCode": %s }\n' "${PRIOR_RESULT}" "${PRIOR_EXIT}"
        printf '  },\n'
        printf '  "cleanup": "%s",\n' "${CLEANUP_RESULT}"
        printf '  "secretsPrinted": false,\n'
        printf '  "verdict": "%s",\n' "${FINAL_VERDICT}"
        printf '  "failureCode": "%s"\n' "${FAIL_CODE}"
        printf '}\n'
    } >"${EVIDENCE_PATH}"
}

on_exit() {
    local exit_code="$?"
    trap - EXIT INT TERM
    set +e

    if [[ "${exit_code}" -eq 0 ]]; then
        if [[ "${CANDIDATE_CLEAN}" == "true" ]]; then
            FINAL_VERDICT="PASS_LOCAL_SHA_BOUND"
        else
            FINAL_VERDICT="PASS_LOCAL_FILE_DIGEST_BOUND_DIRTY"
        fi
        FAIL_CODE="NONE"
    fi

    if ! cleanup_resources; then
        exit_code=1
        FINAL_VERDICT="HOLD"
        FAIL_CODE="EXACT_CLEANUP_FAILED"
    fi
    remove_secret_material
    write_evidence

    log "evidence: ${EVIDENCE_PATH}"
    log "verdict: ${FINAL_VERDICT}; empty=${EMPTY_RESULT}; prior-state=${PRIOR_RESULT}; cleanup=${CLEANUP_RESULT}"
    exit "${exit_code}"
}

trap on_exit EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if [[ -n "${TEST_AGENT_RUNTIME_MIGRATION_URL+x}" || -n "${TEST_AGENT_RUNTIME_DATABASE_URL+x}" ]]; then
    die "CALLER_DATABASE_URL_REJECTED" "database URLs must be unset; this harness only uses URLs derived from its own disposable container"
fi

[[ "${KEEP_VALUE}" == "0" || "${KEEP_VALUE}" == "1" ]] || die "INVALID_KEEP" "KEEP must be exactly 0 or 1"
[[ "${TEST_TARGET}" =~ ^[A-Za-z0-9_-]+$ ]] || die "INVALID_TEST_TARGET" "test target contains unsupported characters"
[[ "${TEST_NAME}" =~ ^[A-Za-z0-9_:.-]+$ ]] || die "INVALID_TEST_NAME" "test name contains unsupported characters"
[[ "${RLS_MIGRATION_BASENAME}" =~ ^0006[A-Za-z0-9_.-]*\.sql$ ]] || die "INVALID_RLS_MIGRATION" "RLS migration override must be a 0006 SQL basename"

for required in awk cargo date df docker git grep mktemp od shasum sleep tr; do
    require_command "${required}"
done

assert_resource_gate

[[ -n "${POSTGRES_IMAGE}" ]] || die "PINNED_IMAGE_REQUIRED" "set TEST_AGENT_RUNTIME_POSTGRES_IMAGE to a locally present digest-pinned image"
if [[ ! "${POSTGRES_IMAGE}" =~ ^sha256:[0-9a-f]{64}$ && ! "${POSTGRES_IMAGE}" =~ ^[-A-Za-z0-9._/:]+@sha256:[0-9a-f]{64}$ ]]; then
    die "UNPINNED_IMAGE_REJECTED" "Postgres image must be an immutable sha256 image ID or digest-qualified reference"
fi

for required_file in \
    "${ROLE_FIXTURE}" \
    "${MIGRATIONS_DIR}/0001_web_leads_and_events.sql" \
    "${MIGRATIONS_DIR}/0002_pending_work.sql" \
    "${MIGRATIONS_DIR}/0003_control_gates.sql" \
    "${MIGRATIONS_DIR}/0004_failure_lessons.sql" \
    "${MIGRATIONS_DIR}/0005_agent_runtime_core.sql" \
    "${RLS_MIGRATION}" \
    "${TEST_SOURCE}"; do
    [[ -f "${required_file}" ]] || die "REQUIRED_FILE_ABSENT" "required local contract file is absent"
done

grep -Fq 'TEST_AGENT_RUNTIME_MIGRATION_URL' "${TEST_SOURCE}" || die "TEST_CONTRACT_DRIFT" "test target does not require the migration URL"
grep -Fq 'TEST_AGENT_RUNTIME_DATABASE_URL' "${TEST_SOURCE}" || die "TEST_CONTRACT_DRIFT" "test target does not require the runtime URL"
grep -Fq 'TEST_AGENT_RUNTIME_SCENARIO' "${TEST_SOURCE}" || die "TEST_CONTRACT_DRIFT" "test target does not require a scenario"
grep -Fq '"empty"' "${TEST_SOURCE}" || die "TEST_CONTRACT_DRIFT" "test target has no empty scenario"
grep -Fq '"prior-state"' "${TEST_SOURCE}" || die "TEST_CONTRACT_DRIFT" "test target has no prior-state scenario"
grep -Fq '#[ignore' "${TEST_SOURCE}" || die "TEST_CONTRACT_DRIFT" "disposable Postgres test must remain explicitly ignored"

REPO_HEAD="$(git -C "${REPO_ROOT}" rev-parse HEAD)"
if [[ -z "$(git -C "${REPO_ROOT}" status --porcelain=v1)" ]]; then
    CANDIDATE_CLEAN="true"
fi
MIGRATION_0001_SHA="$(sha256_file "${MIGRATIONS_DIR}/0001_web_leads_and_events.sql")"
MIGRATION_0002_SHA="$(sha256_file "${MIGRATIONS_DIR}/0002_pending_work.sql")"
MIGRATION_0003_SHA="$(sha256_file "${MIGRATIONS_DIR}/0003_control_gates.sql")"
MIGRATION_0004_SHA="$(sha256_file "${MIGRATIONS_DIR}/0004_failure_lessons.sql")"
MIGRATION_0005_SHA="$(sha256_file "${MIGRATIONS_DIR}/0005_agent_runtime_core.sql")"
RLS_MIGRATION_SHA="$(sha256_file "${RLS_MIGRATION}")"
CANDIDATE_MANIFEST_SHA="$(candidate_manifest_sha)"

docker info >/dev/null 2>&1 || die "DOCKER_DAEMON_UNAVAILABLE" "local Docker daemon is unavailable"
docker image inspect "${POSTGRES_IMAGE}" >/dev/null 2>&1 || die "PINNED_IMAGE_NOT_LOCAL" "pinned Postgres image is not already local; no pull was attempted"
IMAGE_ID="$(docker image inspect --format '{{.Id}}' "${POSTGRES_IMAGE}")"
[[ "${IMAGE_ID}" =~ ^sha256:[0-9a-f]{64}$ ]] || die "LOCAL_IMAGE_ID_INVALID" "local image did not resolve to an immutable sha256 ID"

TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/sirinx-agent-runtime-pg.${RUN_ID}.XXXXXX")"
ADMIN_PASSWORD_FILE="${TEMP_DIR}/postgres-password"
ADMIN_PASSWORD="$(random_hex 32)"
MIGRATOR_PASSWORD="$(random_hex 32)"
RUNTIME_PASSWORD="$(random_hex 32)"
printf '%s' "${ADMIN_PASSWORD}" >"${ADMIN_PASSWORD_FILE}"
unset ADMIN_PASSWORD

docker network create \
    --driver bridge \
    --internal \
    --label "${DISPOSABLE_LABEL}" \
    --label "${HARNESS_LABEL}" \
    --label "com.sirinx.run-id=${RUN_ID}" \
    "${NETWORK_NAME}" >/dev/null
NETWORK_CREATED="true"

CONTAINER_ID="$(docker run \
    --detach \
    --pull never \
    --name "${CONTAINER_NAME}" \
    --label "${DISPOSABLE_LABEL}" \
    --label "${HARNESS_LABEL}" \
    --label "com.sirinx.run-id=${RUN_ID}" \
    --network "${NETWORK_NAME}" \
    --publish '127.0.0.1::5432' \
    --mount "type=bind,src=${ADMIN_PASSWORD_FILE},dst=/run/secrets/postgres_password,readonly" \
    --env POSTGRES_PASSWORD_FILE=/run/secrets/postgres_password \
    --env POSTGRES_USER=postgres \
    --env POSTGRES_DB=postgres \
    --health-cmd='pg_isready --username postgres --dbname postgres' \
    --health-interval=1s \
    --health-timeout=3s \
    --health-retries=45 \
    "${POSTGRES_IMAGE}")"

container_has_exact_labels "${CONTAINER_ID}" || die "CONTAINER_LABEL_MISMATCH" "created container did not retain exact disposable labels"

for ((_attempt = 1; _attempt <= 45; _attempt++)); do
    health="$(docker container inspect --format '{{.State.Health.Status}}' "${CONTAINER_ID}")"
    [[ "${health}" == "healthy" ]] && break
    [[ "${health}" == "unhealthy" ]] && die "POSTGRES_UNHEALTHY" "disposable Postgres failed its local health check"
    sleep 1
done
[[ "$(docker container inspect --format '{{.State.Health.Status}}' "${CONTAINER_ID}")" == "healthy" ]] || die "POSTGRES_START_TIMEOUT" "disposable Postgres did not become healthy"

PORT_LINE="$(docker port "${CONTAINER_ID}" 5432/tcp)"
[[ "${PORT_LINE}" =~ ^127\.0\.0\.1:([0-9]+)$ ]] || die "NON_LOOPBACK_PORT_REJECTED" "Docker did not bind the disposable database exclusively to IPv4 loopback"
PORT="${BASH_REMATCH[1]}"

docker exec -i "${CONTAINER_ID}" \
    psql -X --quiet --set ON_ERROR_STOP=1 --username postgres --dbname postgres \
    <"${ROLE_FIXTURE}" >/dev/null

docker exec -i "${CONTAINER_ID}" \
    psql -X --quiet --set ON_ERROR_STOP=1 --username postgres --dbname postgres \
    >/dev/null <<SQL
create role "${MIGRATOR_LOGIN}"
    login inherit nosuperuser nocreatedb nocreaterole noreplication nobypassrls
    password '${MIGRATOR_PASSWORD}';
grant ${OWNER_ROLE} to "${MIGRATOR_LOGIN}";

create role "${RUNTIME_LOGIN}"
    login inherit nosuperuser nocreatedb nocreaterole noreplication nobypassrls
    password '${RUNTIME_PASSWORD}';
grant ${APP_ROLE} to "${RUNTIME_LOGIN}";

create database "${EMPTY_DATABASE}" owner ${OWNER_ROLE};
revoke connect, temporary on database "${EMPTY_DATABASE}" from public;
grant connect on database "${EMPTY_DATABASE}" to ${OWNER_ROLE}, ${APP_ROLE};

create database "${PRIOR_DATABASE}" owner ${OWNER_ROLE};
revoke connect, temporary on database "${PRIOR_DATABASE}" from public;
grant connect on database "${PRIOR_DATABASE}" to ${OWNER_ROLE}, ${APP_ROLE};
SQL

run_scenario() {
    local scenario="$1"
    local database_name="$2"
    local migration_url runtime_url scenario_exit

    assert_resource_gate
    migration_url="postgresql://${MIGRATOR_LOGIN}:${MIGRATOR_PASSWORD}@127.0.0.1:${PORT}/${database_name}?sslmode=disable&options=-c%20role%3D${OWNER_ROLE}"
    runtime_url="postgresql://${RUNTIME_LOGIN}:${RUNTIME_PASSWORD}@127.0.0.1:${PORT}/${database_name}?sslmode=disable"
    if (
        unset DATABASE_URL TEST_DATABASE_URL PGDATABASE PGHOST PGOPTIONS PGPASSWORD PGPORT PGUSER
        export CARGO_NET_OFFLINE=true
        export CARGO_TERM_COLOR=never
        export TEST_AGENT_RUNTIME_MIGRATION_URL="${migration_url}"
        export TEST_AGENT_RUNTIME_DATABASE_URL="${runtime_url}"
        export TEST_AGENT_RUNTIME_SCENARIO="${scenario}"
        cargo test -p sirinx-store --test "${TEST_TARGET}" "${TEST_NAME}" -- --ignored --exact
    ) >/dev/null 2>&1; then
        scenario_exit=0
        if [[ "${scenario}" == "empty" ]]; then
            EMPTY_RESULT="PASS"
            EMPTY_EXIT=0
        else
            PRIOR_RESULT="PASS"
            PRIOR_EXIT=0
        fi
    else
        scenario_exit=$?
        if [[ "${scenario}" == "empty" ]]; then
            EMPTY_RESULT="FAIL"
            EMPTY_EXIT="${scenario_exit}"
        else
            PRIOR_RESULT="FAIL"
            PRIOR_EXIT="${scenario_exit}"
        fi
    fi

    # Test output is intentionally never echoed or retained: connection URLs
    # and ephemeral passwords exist only in the child process environment.
    return "${scenario_exit}"
}

if ! run_scenario "empty" "${EMPTY_DATABASE}"; then
    :
fi
if ! run_scenario "prior-state" "${PRIOR_DATABASE}"; then
    :
fi

unset MIGRATOR_PASSWORD RUNTIME_PASSWORD

if [[ "${EMPTY_RESULT}" != "PASS" || "${PRIOR_RESULT}" != "PASS" ]]; then
    FAIL_CODE="SCENARIO_TEST_FAILED"
    die "${FAIL_CODE}" "one or more focused scenarios failed; raw output was discarded to prevent credential disclosure"
fi

[[ "$(candidate_manifest_sha)" == "${CANDIDATE_MANIFEST_SHA}" ]] || die "CANDIDATE_DRIFT_DURING_RUN" "candidate files changed while disposable verification was running"

FAIL_CODE="NONE"
