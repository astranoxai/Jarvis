import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ToolDefinition } from './types.js';

const execFileAsync = promisify(execFile);

export const volumeTool: ToolDefinition = {
  name: 'get_volume_status',
  description:
    'Get the current Android audio stream volume levels using Termux:API. Read-only device information.',
  permission: 'read_only',

  parameters: {
    type: 'object',
    properties: {},
    required: []
  },

  async execute() {
    try {
      const { stdout } = await execFileAsync(
        'termux-volume',
        [],
        { timeout: 10000 }
      );

      const volumes = JSON.parse(stdout);

      return {
        success: true,
        device: 'Android',
        volumes
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
