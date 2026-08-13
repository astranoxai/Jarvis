import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ToolDefinition } from './types.js';

const execFileAsync = promisify(execFile);

export const batteryTool: ToolDefinition = {
  name: 'get_battery_status',
  description:
    'Get the current Android device battery status, including percentage, charging state, health, temperature, voltage, and battery current.',
  permission: 'read_only',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },

  async execute() {
    const { stdout } = await execFileAsync(
      'termux-battery-status',
      [],
      { timeout: 5000 }
    );

    return {
      success: true,
      device: 'Android',
      battery: JSON.parse(stdout)
    };
  }
};
