import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { getRoninAgentTeam } from "./agent-team.mjs";

describe("Ronin profile evidence boundary", () => {
  it("does not infer CWD readiness without caller-supplied redacted evidence", () => {
    const team = getRoninAgentTeam();

    expect(team.protectedConfigRead).toBe(false);
    expect(team.summary.cwdEvidenceObserved).toBe(0);
    expect(team.summary.activeProfiles).toBe(0);
    expect(team.profileDefinitions.every((profile) => profile.cwd === null)).toBe(true);
    expect(team.profileDefinitions.every((profile) => profile.cwdReady === false)).toBe(true);
    expect(team.profileDefinitions.every((profile) => profile.profileReady === false)).toBe(true);
  });

  it("accepts an explicit redacted CWD observation without reading profile config", () => {
    const team = getRoninAgentTeam({
      profileCwdObservations: {
        shogun: {
          observed: true,
          cwd: "/Users/sirinx/sirinx-os"
        }
      }
    });
    const shogun = team.profileDefinitions.find((profile) => profile.name === "shogun");

    expect(team.summary.cwdEvidenceObserved).toBe(1);
    expect(team.summary.activeProfiles).toBe(0);
    expect(shogun).toMatchObject({
      cwd: "/Users/sirinx/sirinx-os",
      expectedCwd: "/Users/sirinx/sirinx-os",
      cwdReady: true,
      cwdEvidence: {
        observed: true,
        source: "caller-supplied-redacted-observation"
      },
      runtimeReady: false
    });
  });

  it("counts only a fresh running handshake as an active runtime", () => {
    const now = new Date("2026-07-20T06:30:00.000Z");
    const team = getRoninAgentTeam({
      now,
      profileCwdObservations: {
        shogun: { observed: true, cwd: "/Users/sirinx/sirinx-os" }
      },
      profileRuntimeObservations: {
        shogun: {
          observed: true,
          profileName: "shogun",
          cwd: "/Users/sirinx/sirinx-os",
          running: true,
          handshakeVerified: true,
          observedAt: "2026-07-20T06:29:30.000Z"
        }
      },
      verifyRuntimeObservation: () => true
    });

    expect(team.summary.activeProfiles).toBe(1);
    expect(team.profileDefinitions.find((profile) => profile.name === "shogun")).toMatchObject({
      runtimeReady: true,
      status: "profile-runtime-attested",
      runtimeEvidence: {
        fresh: true,
        running: true,
        handshakeVerified: true,
        identityBound: true,
        attestationVerified: true
      }
    });
  });

  it("does not count a fresh self-reported handshake without an attestation verifier", () => {
    const team = getRoninAgentTeam({
      now: new Date("2026-07-20T06:30:00.000Z"),
      profileCwdObservations: {
        shogun: { observed: true, cwd: "/Users/sirinx/sirinx-os" }
      },
      profileRuntimeObservations: {
        shogun: {
          observed: true,
          profileName: "shogun",
          cwd: "/Users/sirinx/sirinx-os",
          running: true,
          handshakeVerified: true,
          observedAt: "2026-07-20T06:29:30.000Z"
        }
      }
    });

    expect(team.summary.activeProfiles).toBe(0);
    expect(team.profileDefinitions.find((profile) => profile.name === "shogun")).toMatchObject({
      runtimeReady: false,
      runtimeEvidence: {
        attestationVerified: false,
        source: "caller-supplied-unverified-runtime-observation"
      }
    });
  });

  it("rejects cross-profile replay even when the injected verifier returns true", () => {
    const observation = {
      observed: true,
      profileName: "shogun",
      cwd: "/Users/sirinx/sirinx-os",
      running: true,
      handshakeVerified: true,
      observedAt: "2026-07-20T06:29:30.000Z"
    };
    const team = getRoninAgentTeam({
      now: new Date("2026-07-20T06:30:00.000Z"),
      profileCwdObservations: {
        shogun: { observed: true, cwd: "/Users/sirinx/sirinx-os" },
        planner: { observed: true, cwd: "/Users/sirinx/sirinx-os" }
      },
      profileRuntimeObservations: {
        shogun: observation,
        planner: observation
      },
      verifyRuntimeObservation: () => true
    });

    expect(team.summary.activeProfiles).toBe(1);
    expect(team.profileDefinitions.find((profile) => profile.name === "planner")).toMatchObject({
      runtimeReady: false,
      runtimeEvidence: {
        profileName: "shogun",
        identityBound: false,
        attestationVerified: false
      }
    });
  });

  it("contains no profile-config file read implementation", async () => {
    const source = await readFile(new URL("./agent-team.mjs", import.meta.url), "utf8");

    expect(source).not.toMatch(/readFile(?:Sync)?/);
    expect(source).not.toMatch(/existsSync/);
    expect(source).not.toMatch(/config\.yaml/);
  });
});
