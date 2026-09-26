import {
  getTools
} from '../tools/registry.js';


const OPENROUTER_URL =
  'https://openrouter.ai/api/v1/chat/completions';


/* ============================================================
   MULTIMODAL MESSAGE TYPES
============================================================ */

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
  | (
      | TextContentPart
      | ImageContentPart
    )[];


export type OpenRouterMessage = {
  role: string;

  content?:
    | MessageContent
    | null;

  tool_calls?:
    unknown[];

  tool_call_id?:
    string;

  name?:
    string;
};


/* ============================================================
   IMAGE DETECTION
============================================================ */

function messageHasImage(
  message: OpenRouterMessage
): boolean {

  if (
    !Array.isArray(
      message.content
    )
  ) {
    return false;
  }


  return message.content.some(
    part =>
      part?.type ===
      'image_url' &&
      typeof part.image_url?.url ===
        'string' &&
      part.image_url.url.length >
        0
  );
}


function requestHasImage(
  messages: OpenRouterMessage[]
): boolean {

  return messages.some(
    message =>
      messageHasImage(
        message
      )
  );
}


/* ============================================================
   TOOLS
============================================================ */

function buildTools() {
  return getTools().map(
    tool => ({
      type:
        'function',

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
}


/* ============================================================
   OPENROUTER
============================================================ */

export async function askOpenRouter(
  messages: OpenRouterMessage[]
): Promise<OpenRouterMessage> {

  const apiKey =
    process.env
      .OPENROUTER_API_KEY
      ?.trim();


  if (
    !apiKey
  ) {
    throw new Error(
      'OPENROUTER_API_KEY is missing.'
    );
  }


  const visionRequest =
    requestHasImage(
      messages
    );


  /*
    Normal NOVA chat keeps using your
    normal configured model.

    Webcam / image requests use a separate
    vision-capable OpenRouter route.

    NOVA_VISION_MODEL is optional.

    If it is not configured, OpenRouter's
    free router is used for image requests.
  */

  const textModel =
    process.env
      .OPENROUTER_MODEL
      ?.trim() ||

    'openai/gpt-4o-mini';


  const visionModel =
    process.env
      .NOVA_VISION_MODEL
      ?.trim() ||

    'openrouter/free';


  const model =
    visionRequest
      ? visionModel
      : textModel;


  /*
    Tool schemas are useful for normal
    NOVA chat.

    We intentionally do NOT include tools
    on webcam vision turns. That gives
    OpenRouter the widest selection of
    vision-capable models and makes the
    webcam request more reliable.
  */

  const requestBody:
    Record<string, unknown> =
    {
      model,
      messages
    };


  if (
    !visionRequest
  ) {
    const tools =
      buildTools();


    if (
      tools.length >
      0
    ) {
      requestBody.tools =
        tools;

      requestBody.tool_choice =
        'auto';
    }
  }


  console.log(
    ''
  );

  console.log(
    '=============================================='
  );

  console.log(
    'NOVA → OpenRouter'
  );

  console.log(
    `Requested model: ${model}`
  );

  console.log(
    `Vision request: ${visionRequest ? 'YES' : 'NO'}`
  );

  console.log(
    `Messages: ${messages.length}`
  );

  console.log(
    '=============================================='
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
          JSON.stringify(
            requestBody
          )
      }
    );


  const body =
    (
      await response.json()
    ) as any;


  if (
    !response.ok
  ) {

    const message =
      body?.error?.message ||
      body?.message ||
      `OpenRouter HTTP ${response.status}`;


    console.error(
      'OpenRouter error:',
      body
    );


    throw new Error(
      message
    );
  }


  const result =
    body?.choices?.[0]?.message;


  if (
    !result
  ) {
    console.error(
      'OpenRouter response:',
      body
    );


    throw new Error(
      'OpenRouter returned no message.'
    );
  }


  console.log(
    `OpenRouter selected model: ${body?.model || model}`
  );

  console.log(
    `Vision completed: ${visionRequest ? 'YES' : 'NO'}`
  );

  console.log(
    '=============================================='
  );


  return result as OpenRouterMessage;
}