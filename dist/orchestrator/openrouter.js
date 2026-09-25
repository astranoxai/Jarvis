"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askOpenRouter = askOpenRouter;
const registry_js_1 = require("../tools/registry.js");
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
async function askOpenRouter(messages) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is not configured');
    }
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
    const tools = (0, registry_js_1.getTools)().map(tool => ({
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
        }
    }));
    const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'NOVA'
        },
        body: JSON.stringify({
            model,
            messages,
            tools,
            tool_choice: 'auto'
        })
    });
    const body = await response.json();
    if (!response.ok) {
        throw new Error(`OpenRouter error ${response.status}: ` +
            JSON.stringify(body.error ?? body));
    }
    return body.choices?.[0]?.message;
}
