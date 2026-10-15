import { describe, expect, it } from "vitest";
import { EnergyFlowShaderDef } from "./EnergyFlowShader";

describe("EnergyFlowShader", () => {
  it("exports matching shader uniforms and live flow controls", () => {
    expect(EnergyFlowShaderDef.uniforms.uTime.value).toBe(0);
    expect(EnergyFlowShaderDef.vertexShader).toContain("uFlowDirection");
    expect(EnergyFlowShaderDef.fragmentShader).toContain("uIrradiationIntensity");
    expect(EnergyFlowShaderDef.fragmentShader).toContain("uColorCore");
    expect(EnergyFlowShaderDef.fragmentShader).toContain("uColorGlow");
    expect(EnergyFlowShaderDef.fragmentShader).toContain("uAlpha");
  });
  it("has GLSL entry points and fragment output", () => {
    expect(EnergyFlowShaderDef.vertexShader).toMatch(/void\s+main\s*\(/);
    expect(EnergyFlowShaderDef.fragmentShader).toMatch(/void\s+main\s*\(/);
    expect(EnergyFlowShaderDef.fragmentShader).toContain("gl_FragColor");
  });
  it("keeps shader values in a material-independent template", () => {
    expect(EnergyFlowShaderDef.uniforms.uColorCore.value).toBeNull();
    expect(EnergyFlowShaderDef.uniforms.uColorGlow.value).toBeNull();
    expect(EnergyFlowShaderDef.uniforms.uSpeed.value).toBeGreaterThan(0);
  });
});
