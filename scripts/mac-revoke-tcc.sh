#!/usr/bin/env bash
# Revoke the temporary Full Disk Access grants on a Mac worker node
# after the build window closes. Run ON THE MAC (mac-mini-m2), not in CI:
#
#   ./scripts/mac-revoke-tcc.sh            # revoke known host apps
#   ./scripts/mac-revoke-tcc.sh --verify   # only check current state
#
# tccutil reset removes the entry entirely, so macOS prompts again the
# next time access is requested — the safest post-build state.

set -euo pipefail

if [ "$(uname)" != "Darwin" ]; then
    echo "error: this script must run on macOS (the Mac node itself)" >&2
    exit 1
fi

# Host apps that may have received the temporary build-window grant.
# Extend this list if another host app was granted (see MAC_TCC_PERMISSIONS.md).
BUNDLES=(
    "com.apple.Terminal"
    "com.googlecode.iterm2"
    "com.microsoft.VSCode"
)

if [ "${1:-}" = "--verify" ]; then
    echo "Open System Settings → Privacy & Security → Full Disk Access"
    echo "and confirm none of these remain enabled:"
    printf ' - %s\n' "${BUNDLES[@]}"
    exit 0
fi

for bundle in "${BUNDLES[@]}"; do
    if tccutil reset SystemPolicyAllFiles "$bundle" >/dev/null 2>&1; then
        echo "revoked Full Disk Access entry: $bundle"
    else
        echo "no entry to revoke for: $bundle (ok)"
    fi
done

echo
echo "Done. Restart the host apps, then verify a file prompt appears again."
echo "Record the revoke date in MAC_TCC_PERMISSIONS.md."
