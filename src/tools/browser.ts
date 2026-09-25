import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { ToolDefinition } from './types.js';

const execFileAsync = promisify(execFile);

function findChrome(): string {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
  ];

  for (const chromePath of possiblePaths) {
    if (chromePath && existsSync(chromePath)) {
      return chromePath;
    }
  }

  throw new Error('Google Chrome was not found on this Windows PC.');
}

async function openChromeUrl(url: string): Promise<string> {
  if (!/^https?:\/\//i.test(url)) {
    throw new Error('Only http:// and https:// URLs are allowed.');
  }

  const chromePath = findChrome();

  await execFileAsync(
    chromePath,
    [
      '--new-tab',
      url
    ],
    {
      windowsHide: true
    }
  );

  return url;
}

export const browserTool: ToolDefinition = {
  name: 'open_browser',

  description:
    'Open a web URL in Google Chrome on Windows in a new tab.',

  permission: 'write_low_risk',

  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description:
          'The complete http or https URL to open in Google Chrome.'
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
      const opened = await openChromeUrl(url);

      return {
        success: true,
        browser_action: 'open_url',
        browser: 'Google Chrome',
        url: opened
      };
    } catch (error: any) {
      return {
        success: false,
        error:
          error?.message ||
          'Unable to open Google Chrome.'
      };
    }
  }
};

export const browserSearchTool: ToolDefinition = {
  name: 'browser_search',

  description:
    'Search Google in a new Google Chrome tab on Windows.',

  permission: 'write_low_risk',

  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The Google search query.'
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
      const opened = await openChromeUrl(url);

      return {
        success: true,
        browser_action: 'search',
        browser: 'Google Chrome',
        query,
        url: opened
      };
    } catch (error: any) {
      return {
        success: false,
        error:
          error?.message ||
          'Unable to open Google search in Chrome.'
      };
    }
  }
};
