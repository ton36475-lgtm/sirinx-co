export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | { [key: string]: JsonValue }
  | JsonValue[];

export type PermissionGateState = 'locked' | 'unlocked' | 'bypass_allowed';

export type VerificationEvidence = {
  command: string;
  status: 'passed' | 'failed' | 'skipped';
  checkedAt: string;
};
