import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ToolDefinition } from './types.js';

const execFileAsync = promisify(execFile);

export const locationTool: ToolDefinition = {
  name: 'get_location',
  description:
    'Get the Android device current location using Termux:API. This is a read-only device location tool. Use it when the user asks where they are or requests their current device location.',
  permission: 'read_only',

  parameters: {
    type: 'object',
    properties: {},
    required: []
  },

  async execute() {
    try {
      const { stdout } = await execFileAsync(
        'termux-location',
        [],
        { timeout: 20000 }
      );

      const location = JSON.parse(stdout);

      return {
        success: true,
        device: 'Android',
        location
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
