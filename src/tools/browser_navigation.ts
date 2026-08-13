import { ToolDefinition } from './types.js';

export const browserBackTool: ToolDefinition = {
  name: 'browser_back',

  description:
    'Go back one page in the currently active Android browser. Requires Android browser-control integration.',

  permission: 'write_low_risk',

  parameters: {
    type: 'object',
    properties: {},
    required: []
  },

  async execute() {
    return {
      success: false,
      error:
        'Browser back control is not available from the current Termux environment. Android input/keyevent access is unavailable.'
    };
  }
};

export const browserForwardTool: ToolDefinition = {
  name: 'browser_forward',

  description:
    'Go forward one page in the currently active Android browser. Requires Android browser-control integration.',

  permission: 'write_low_risk',

  parameters: {
    type: 'object',
    properties: {},
    required: []
  },

  async execute() {
    return {
      success: false,
      error:
        'Browser forward control requires Android browser-control integration.'
    };
  }
};
