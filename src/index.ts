import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { askOpenRouter } from './orchestrator/openrouter.js';
import { executeToolCall } from './executor.js';

const historyFile = path.resolve('data/chat_history.json');

type Message = {
  role: string;
  content?: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
};

async function loadHistory(): Promise<Message[]> {
  try {
    const data = await fs.readFile(historyFile, 'utf8');
    const history = JSON.parse(data) as Message[];

    // Never send persisted tool messages or tool-call messages back
    // to the model. Chat history should contain only normal conversation.
    return history
      .filter(message =>
        (message.role === 'user' || message.role === 'assistant') &&
        typeof message.content === 'string' &&
        message.content.length > 0
      )
      .map(message => ({
        role: message.role,
        content: message.content as string
      }));
  } catch {
    return [];
  }
}

async function saveHistory(messages: Message[]) {
  await fs.mkdir(path.dirname(historyFile), { recursive: true });

  // Persist only normal user/assistant conversation.
  // Tool calls and tool results are temporary agent-loop state.
  const cleanHistory = messages
    .filter(message =>
      (message.role === 'user' || message.role === 'assistant') &&
      typeof message.content === 'string' &&
      message.content.length > 0
    )
    .map(message => ({
      role: message.role,
      content: message.content as string
    }));

  await fs.writeFile(
    historyFile,
    JSON.stringify(cleanHistory, null, 2),
    'utf8'
  );
}

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });

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
      await fs.mkdir(path.dirname(historyFile), { recursive: true });

      await fs.writeFile(historyFile, '[]', 'utf8');

      return {
        success: true,
        message: 'Conversation history cleared.'
      };
    } catch (error) {
      request.log.error(error);

      return reply.code(500).send({
        error: 'Failed to clear conversation history'
      });
    }
  });

  app.post('/chat', async (request, reply) => {
    const body = request.body as { message?: string };

    if (!body?.message || typeof body.message !== 'string') {
      return reply.code(400).send({
        error: 'message is required'
      });
    }

    try {
      const history = await loadHistory();

      const messages: Message[] = [
        {
          role: 'system',
          content:
            `You are JARVIS, a capable personal AI assistant with access to tools.

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

      let response = await askOpenRouter(messages);

      if (!response.tool_calls?.length) {
        messages.push(response);

        await saveHistory(
          messages.filter(message => message.role !== 'system')
        );

        return { response };
      }

      messages.push({
        role: 'assistant',
        content: response.content ?? null,
        tool_calls: response.tool_calls
      });

      for (const toolCall of response.tool_calls) {
        const toolResult = await executeToolCall(toolCall);

        messages.push({
          role: 'tool',
          content: toolResult.content,
          tool_call_id: toolResult.tool_call_id,
          name: toolResult.name
        });
      }

      response = await askOpenRouter(messages);

      messages.push(response);

      await saveHistory(
        messages.filter(message => message.role !== 'system')
      );

      return { response };

    } catch (error) {
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
