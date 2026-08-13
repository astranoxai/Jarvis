"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const openrouter_js_1 = require("./orchestrator/openrouter.js");
const executor_js_1 = require("./executor.js");
const historyFile = node_path_1.default.resolve('data/chat_history.json');
async function loadHistory() {
    try {
        const data = await node_fs_1.promises.readFile(historyFile, 'utf8');
        const history = JSON.parse(data);
        // Never send persisted tool messages or tool-call messages back
        // to the model. Chat history should contain only normal conversation.
        return history
            .filter(message => (message.role === 'user' || message.role === 'assistant') &&
            typeof message.content === 'string' &&
            message.content.length > 0)
            .map(message => ({
            role: message.role,
            content: message.content
        }));
    }
    catch {
        return [];
    }
}
async function saveHistory(messages) {
    await node_fs_1.promises.mkdir(node_path_1.default.dirname(historyFile), { recursive: true });
    // Persist only normal user/assistant conversation.
    // Tool calls and tool results are temporary agent-loop state.
    const cleanHistory = messages
        .filter(message => (message.role === 'user' || message.role === 'assistant') &&
        typeof message.content === 'string' &&
        message.content.length > 0)
        .map(message => ({
        role: message.role,
        content: message.content
    }));
    await node_fs_1.promises.writeFile(historyFile, JSON.stringify(cleanHistory, null, 2), 'utf8');
}
async function main() {
    const app = (0, fastify_1.default)({ logger: true });
    await app.register(cors_1.default, { origin: true });
    app.get('/', async () => ({
        name: 'JARVIS',
        status: 'online',
        version: '1.0.0'
    }));
    app.get('/health', async () => ({
        status: 'ok'
    }));
    app.post('/clear-history', async (request, reply) => {
        try {
            await node_fs_1.promises.mkdir(node_path_1.default.dirname(historyFile), { recursive: true });
            await node_fs_1.promises.writeFile(historyFile, '[]', 'utf8');
            return {
                success: true,
                message: 'Conversation history cleared.'
            };
        }
        catch (error) {
            request.log.error(error);
            return reply.code(500).send({
                error: 'Failed to clear conversation history'
            });
        }
    });
    app.post('/chat', async (request, reply) => {
        const body = request.body;
        if (!body?.message || typeof body.message !== 'string') {
            return reply.code(400).send({
                error: 'message is required'
            });
        }
        try {
            const history = await loadHistory();
            const messages = [
                {
                    role: 'system',
                    content: `You are JARVIS, a capable personal AI assistant with access to tools.

GENERAL RULES:
- Use tools whenever they can provide more accurate or useful information.
- Never invent tool results or claim that a tool succeeded when it failed.
- Fresh tool results are authoritative and override older conversation history.
- Never guess current, changing, or real-world information when a tool can provide it.
- After receiving a tool result, base your answer on that result.

TIME AND REAL-WORLD INFORMATION:
- For the current time or date, ALWAYS use get_current_time.
- For weather, ALWAYS use get_weather.
- For current or up-to-date information, use web_search.
- Do not rely on old conversation messages for changing information.

MEMORY:
- Use remember when the user explicitly asks you to remember, save, store, or keep a piece of information.
- ALWAYS use recall when the user asks what you remember about a topic, asks about previously saved information, or asks what is saved about a specific subject. Do not answer from conversation history instead of calling recall.
- Use list_memories when the user asks to list, show, display, or review their saved memories.
- When list_memories is used, preserve every memory returned by the tool. If the user asks for ALL memories, do not omit, merge, summarize, or invent memories. Present each returned memory individually, including its ID and text when requested.
- Use forget_memory when the user explicitly asks you to forget or delete a saved memory.
- Never claim that something was remembered unless the remember tool succeeded.
- Never claim that memories were retrieved unless the recall or list_memories tool succeeded.
- Do not save ordinary conversation unless the user clearly asks you to remember it.
- When multiple memories are relevant, use the memory tools and prefer the most relevant and recent information.
- If a memory tool returns no matching memories, say that no matching saved memory was found rather than inventing one.
- When deleting a memory, use its actual memory ID returned by the memory tools.
- Do not delete memories unless the user explicitly requests deletion.

PERSONALITY:
- Be helpful, concise, and natural.
- Explain what you did when a tool was used when that helps the user understand the result.
- If a tool fails, be honest about the failure and either retry when appropriate or explain the limitation.`
                },
                ...history.slice(-20),
                {
                    role: 'user',
                    content: body.message
                }
            ];
            let response = await (0, openrouter_js_1.askOpenRouter)(messages);
            if (!response.tool_calls?.length) {
                messages.push(response);
                await saveHistory(messages.filter(message => message.role !== 'system'));
                return { response };
            }
            messages.push({
                role: 'assistant',
                content: response.content ?? null,
                tool_calls: response.tool_calls
            });
            for (const toolCall of response.tool_calls) {
                const toolResult = await (0, executor_js_1.executeToolCall)(toolCall);
                messages.push({
                    role: 'tool',
                    content: toolResult.content,
                    tool_call_id: toolResult.tool_call_id,
                    name: toolResult.name
                });
            }
            response = await (0, openrouter_js_1.askOpenRouter)(messages);
            messages.push(response);
            await saveHistory(messages.filter(message => message.role !== 'system'));
            return { response };
        }
        catch (error) {
            request.log.error(error);
            return reply.code(500).send({
                error: 'JARVIS AI request failed'
            });
        }
    });
    const port = Number(process.env.PORT || 3000);
    const host = process.env.HOST || '0.0.0.0';
    await app.listen({ port, host });
    console.log(`JARVIS running on http://${host}:${port}`);
}
main().catch((error) => {
    console.error('Failed to start JARVIS:', error);
    process.exit(1);
});
