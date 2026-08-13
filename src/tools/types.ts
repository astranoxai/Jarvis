export type Permission =
  | 'read_only'
  | 'write_low_risk'
  | 'write_high_risk';

export interface ToolContext {
  userId?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  permission: Permission;
  parameters: Record<string, unknown>;
  execute: (
    args: Record<string, unknown>,
    context: ToolContext
  ) => Promise<unknown>;
}
