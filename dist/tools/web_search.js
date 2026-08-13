"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webSearchTool = void 0;
exports.webSearchTool = {
    name: 'web_search',
    description: 'Search the web for information.',
    permission: 'read_only',
    parameters: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'The search query.'
            }
        },
        required: ['query'],
        additionalProperties: false
    },
    async execute(args) {
        const query = String(args.query ?? '').trim();
        if (!query) {
            throw new Error('Search query is required');
        }
        const url = 'https://api.duckduckgo.com/?' +
            new URLSearchParams({
                q: query,
                format: 'json',
                no_html: '1',
                skip_disambig: '1'
            });
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Web search failed');
        }
        const data = await response.json();
        const results = [];
        if (data.AbstractText) {
            results.push({
                title: data.Heading || query,
                url: data.AbstractURL || '',
                description: data.AbstractText
            });
        }
        for (const topic of data.RelatedTopics ?? []) {
            if (topic.Text && topic.FirstURL) {
                results.push({
                    title: topic.Text.split(' - ')[0],
                    url: topic.FirstURL,
                    description: topic.Text
                });
            }
            if (results.length >= 5)
                break;
        }
        return {
            query,
            results
        };
    }
};
