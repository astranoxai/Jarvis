"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.readWebpageTool = void 0;
const cheerio = __importStar(require("cheerio"));
exports.readWebpageTool = {
    name: 'read_webpage',
    description: 'Fetch and read the text content of a public webpage. This tool is read-only and does not log in, submit forms, or modify websites.',
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
        const requested = typeof args.max_chars === 'number'
            ? Math.floor(args.max_chars)
            : 12000;
        const maxChars = Math.max(1000, Math.min(requested, 30000));
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'NOVA/1.0 webpage reader'
                },
                redirect: 'follow'
            });
            if (!response.ok) {
                return {
                    success: false,
                    error: `HTTP ${response.status} ${response.statusText}`
                };
            }
            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('text/html')) {
                return {
                    success: false,
                    error: `URL did not return an HTML webpage. Content-Type: ${contentType}`
                };
            }
            const html = await response.text();
            const $ = cheerio.load(html);
            $('script, style, noscript, iframe, svg').remove();
            const title = $('title').first().text().trim();
            const text = $('body')
                .text()
                .replace(/\s+/g, ' ')
                .trim();
            const truncated = text.length > maxChars;
            return {
                success: true,
                url,
                title,
                text: truncated
                    ? text.slice(0, maxChars) + '...'
                    : text,
                truncated
            };
        }
        catch (error) {
            return {
                success: false,
                error: error?.message ||
                    'Unable to read webpage.'
            };
        }
    }
};
