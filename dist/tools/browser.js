"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.browserSearchTool = exports.browserTool = void 0;
const node_child_process_1 = require("node:child_process");
const node_util_1 = require("node:util");
const node_fs_1 = require("node:fs");
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
function findChrome() {
    const possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
    ];
    for (const chromePath of possiblePaths) {
        if (chromePath && (0, node_fs_1.existsSync)(chromePath)) {
            return chromePath;
        }
    }
    throw new Error('Google Chrome was not found on this Windows PC.');
}
async function openChromeUrl(url) {
    if (!/^https?:\/\//i.test(url)) {
        throw new Error('Only http:// and https:// URLs are allowed.');
    }
    const chromePath = findChrome();
    await execFileAsync(chromePath, [
        '--new-tab',
        url
    ], {
        windowsHide: true
    });
    return url;
}
exports.browserTool = {
    name: 'open_browser',
    description: 'Open a web URL in Google Chrome on Windows in a new tab.',
    permission: 'write_low_risk',
    parameters: {
        type: 'object',
        properties: {
            url: {
                type: 'string',
                description: 'The complete http or https URL to open in Google Chrome.'
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
        }
        catch (error) {
            return {
                success: false,
                error: error?.message ||
                    'Unable to open Google Chrome.'
            };
        }
    }
};
exports.browserSearchTool = {
    name: 'browser_search',
    description: 'Search Google in a new Google Chrome tab on Windows.',
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
        const url = 'https://www.google.com/search?q=' +
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
        }
        catch (error) {
            return {
                success: false,
                error: error?.message ||
                    'Unable to open Google search in Chrome.'
            };
        }
    }
};
