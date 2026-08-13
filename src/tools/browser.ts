import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ToolDefinition } from './types.js';

const execFileAsync = promisify(execFile);

async function openBrowser(url: string): Promise<string> {
  if (!/^https?:\/\//i.test(url)) {
    throw new Error('Only http:// and https:// URLs are allowed.');
  }

  await execFileAsync('am', [
    'start',
    '--user', '0',
    '-a', 'android.intent.action.VIEW',
    '-d', url
  ]);

  return url;
}

export const browserTool: ToolDefinition = {
  name: 'open_browser',

  description:
    'Open a web URL using an installed Android browser. Android chooses the appropriate browser. Read-only browser action.',

  permission: 'write_low_risk',

  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The complete http or https URL to open.'
      }
    },
    required: ['url']
  },

  async execute(args) {
    const url = String(args.url || '').trim();

    if (!url) {
      return {
        success: false,
        error: 'URL is required.'
      };
    }

    try {
      const opened = await openBrowser(url);

      return {
        success: true,
        browser_action: 'open_url',
        url: opened
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Unable to open browser.'
      };
    }
  }
};

export const browserSearchTool: ToolDefinition = {
  name: 'browser_search',

  description:
    'Open a web search in the Android browser using the default search engine.',

  permission: 'write_low_risk',

  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query.'
      }
    },
    required: ['query']
  },

  async execute(args) {
    const query = String(args.query || '').trim();

    if (!query) {
      return {
        success: false,
        error: 'Search query is required.'
      };
    }

    const url =
      'https://www.google.com/search?q=' +
      encodeURIComponent(query);

    try {
      const opened = await openBrowser(url);

      return {
        success: true,
        browser_action: 'search',
        query,
        url: opened
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Unable to open browser search.'
      };
    }
  }
};
