import { getTools } from '../tools/registry.js';

const OPENROUTER_URL =
  'https://openrouter.ai/api/v1/chat/completions';


/* =========================================
   MESSAGE TYPES
========================================= */

export type TextContentPart = {
  type: 'text';
  text: string;
};


export type ImageContentPart = {
  type: 'image_url';

  image_url: {
    url: string;
  };
};


export type MessageContent =
  | string
  | null
  | Array<
      TextContentPart |
      ImageContentPart
    >;


export type OpenRouterMessage = {
  role: string;

  content?: MessageContent;

  tool_calls?: unknown[];

  tool_call_id?: string;

  name?: string;
};


/* =========================================
   OPENROUTER REQUEST
========================================= */

export async function askOpenRouter(
  messages: OpenRouterMessage[]
) {

  const apiKey =
    process.env.OPENROUTER_API_KEY;


  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY is not configured'
    );
  }


  const model =
    process.env.OPENROUTER_MODEL ||
    'openai/gpt-4o-mini';


  const tools =
    getTools().map(
      tool => ({
        type: 'function',

        function: {
          name:
            tool.name,

          description:
            tool.description,

          parameters:
            tool.parameters
        }
      })
    );


  const response =
    await fetch(
      OPENROUTER_URL,
      {
        method:
          'POST',

        headers: {
          Authorization:
            `Bearer ${apiKey}`,

          'Content-Type':
            'application/json',

          'HTTP-Referer':
            'http://localhost:3000',

          'X-Title':
            'NOVA'
        },

        body:
          JSON.stringify({
            model,
            messages,
            tools,

            tool_choice:
              'auto'
          })
      }
    );


  const body =
    (await response.json()) as any;


  if (!response.ok) {
    throw new Error(
      `OpenRouter error ${response.status}: ` +
      JSON.stringify(
        body.error ?? body
      )
    );
  }


  const message =
    body
      ?.choices
      ?.[0]
      ?.message;


  if (!message) {
    throw new Error(
      'OpenRouter returned no assistant message'
    );
  }


  return message;
}