import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ToolDefinition } from './types.js';

const execFileAsync = promisify(execFile);

export const deviceInfoTool: ToolDefinition = {
  name: 'get_device_info',
  description:
    'Get read-only information available from Android through Termux:API, including cellular/network and SIM information.',
  permission: 'read_only',

  parameters: {
    type: 'object',
    properties: {},
    required: []
  },

  async execute() {
    try {
      const { stdout } = await execFileAsync(
        'termux-telephony-deviceinfo',
        [],
        { timeout: 10000 }
      );

      const info = JSON.parse(stdout);

      return {
        success: true,
        device: 'Android',
        info
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
