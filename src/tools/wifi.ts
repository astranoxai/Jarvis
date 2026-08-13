import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ToolDefinition } from './types.js';

const execFileAsync = promisify(execFile);

export const wifiTool: ToolDefinition = {
  name: 'get_wifi_status',
  description:
    'Get the Android device current Wi-Fi connection information using Termux:API. Read-only device information.',
  permission: 'read_only',

  parameters: {
    type: 'object',
    properties: {},
    required: []
  },

  async execute() {
    try {
      const { stdout } = await execFileAsync(
        'termux-wifi-connectioninfo',
        [],
        { timeout: 10000 }
      );

      const wifi = JSON.parse(stdout);

      return {
        success: true,
        device: 'Android',
        wifi
      };
    } catch (error) {
      return {
        success: false,
        device: 'Android',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
};
