import { getTools } from '../tools/registry.js';

const OPENROUTER_URL =
  'https://openrouter.ai/api/v1/chat/completions';

export async function askOpenRouter(
  messages: Array<{
    role: string;
    content?: string | null;
    tool_calls?: unknown[];
    tool_call_id?: string;
    name?: string;
  }>
) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const model =
    process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

  const tools = getTools().map(tool => ({
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
      'X-Title': 'JARVIS'
    },
    body: JSON.stringify({
      model,
      messages,
      tools,
      tool_choice: 'auto'
    })
  });

  const body = await response.json() as any;

  if (!response.ok) {
    throw new Error(
      `OpenRouter error ${response.status}: ` +
      JSON.stringify(body.error ?? body)
    );
  }

  return body.choices?.[0]?.message;
}
