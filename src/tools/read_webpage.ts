import { ToolDefinition } from './types.js';
import * as cheerio from 'cheerio';

export const readWebpageTool: ToolDefinition = {
  name: 'read_webpage',

  description:
    'Fetch and read the text content of a public webpage. This tool is read-only and does not log in, submit forms, or modify websites.',

  permission: 'read_only',

  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The complete http or https URL of the webpage.'
      },
      max_chars: {
        type: 'number',
        description: 'Maximum amount of webpage text to return. Default 12000, maximum 30000.'
      }
    },
    required: ['url']
  },

  async execute(args) {
    const url = String(args.url || '').trim();

    if (!/^https?:\/\//i.test(url)) {
      return {
        success: false,
        error: 'Only http:// and https:// URLs are allowed.'
      };
    }

    const requested =
      typeof args.max_chars === 'number'
        ? Math.floor(args.max_chars)
        : 12000;

    const maxChars = Math.max(
      1000,
      Math.min(requested, 30000)
    );

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'JARVIS/1.0 webpage reader'
        },
        redirect: 'follow'
      });

      if (!response.ok) {
        return {
          success: false,
          error:
            `HTTP ${response.status} ${response.statusText}`
        };
      }

      const contentType =
        response.headers.get('content-type') || '';

      if (!contentType.includes('text/html')) {
        return {
          success: false,
          error:
            `URL did not return an HTML webpage. Content-Type: ${contentType}`
        };
      }

      const html = await response.text();

      const $ = cheerio.load(html);

      $('script, style, noscript, iframe, svg').remove();

      const title =
        $('title').first().text().trim();

      const text =
        $('body')
          .text()
          .replace(/\s+/g, ' ')
          .trim();

      const truncated =
        text.length > maxChars;

      return {
        success: true,
        url,
        title,
        text: truncated
          ? text.slice(0, maxChars) + '...'
          : text,
        truncated
      };
    } catch (error: any) {
      return {
        success: false,
        error:
          error?.message ||
          'Unable to read webpage.'
      };
    }
  }
};
