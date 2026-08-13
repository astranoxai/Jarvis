import os from 'node:os';
import { ToolDefinition } from './types.js';

export const systemTool: ToolDefinition = {
  name: 'get_system_info',
  description: 'Get basic information about the computer running JARVIS.',
  permission: 'read_only',

  parameters: {
    type: 'object',
    properties: {},
    additionalProperties: false
  },

  async execute() {
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      architecture: os.arch(),
      cpu_count: os.cpus().length,
      total_memory_gb: Number(
        (os.totalmem() / 1024 ** 3).toFixed(2)
      ),
      free_memory_gb: Number(
        (os.freemem() / 1024 ** 3).toFixed(2)
      ),
      uptime_hours: Number(
        (os.uptime() / 3600).toFixed(2)
      )
    };
  }
};
