import 'dotenv/config';

import Fastify from 'fastify';
import cors from '@fastify/cors';

import {
  promises as fs
} from 'node:fs';

import path from 'node:path';

import {
  askOpenRouter,
  type OpenRouterMessage
} from './orchestrator/openrouter.js';

import {
  executeToolCall
} from './executor.js';

import {
  systemTool
} from './tools/system.js';

import {
  batteryTool
} from './tools/battery.js';

import {
  wifiTool
} from './tools/wifi.js';

import {
  bluetoothTool
} from './tools/bluetooth.js';

import {
  weatherTool
} from './tools/weather.js';

import {
  newsTool
} from './tools/news.js';


/* ============================================================
   CONSTANTS
============================================================ */

const historyFile =
  path.resolve(
    'data/chat_history.json'
  );


const DASHBOARD_CACHE_MS =
  5 * 60 * 1000;


/* ============================================================
   TYPES
============================================================ */

type StoredMessage = {
  role:
    | 'user'
    | 'assistant';

  content:
    string;
};


type ChatBody = {
  message?:
    unknown;

  image?:
    unknown;

  voiceMode?:
    unknown;
};


/* ============================================================
   CACHE
============================================================ */

let cachedWeather:
  unknown =
  null;


let cachedWeatherTime =
  0;


let cachedNews:
  unknown =
  null;


let cachedNewsTime =
  0;


/* ============================================================
   HISTORY
============================================================ */

async function loadHistory():
Promise<StoredMessage[]> {

  try {
    const raw =
      await fs.readFile(
        historyFile,
        'utf8'
      );


    const parsed =
      JSON.parse(
        raw
      );


    if (
      !Array.isArray(
        parsed
      )
    ) {
      return [];
    }


    return parsed.filter(
      (
        item: any
      ): item is StoredMessage =>

        (
          item?.role ===
            'user' ||

          item?.role ===
            'assistant'
        ) &&

        typeof item?.content ===
          'string'
    );


  } catch {
    return [];
  }
}


async function saveHistory(
  history: StoredMessage[]
) {

  await fs.mkdir(
    path.dirname(
      historyFile
    ),

    {
      recursive:
        true
    }
  );


  await fs.writeFile(
    historyFile,

    JSON.stringify(
      history,
      null,
      2
    ),

    'utf8'
  );
}


/* ============================================================
   CAMERA IMAGE VALIDATION
============================================================ */

function validateCameraImage(
  value: unknown
): string | null {

  if (
    typeof value !==
      'string'
  ) {
    return null;
  }


  const image =
    value.trim();


  if (
    !image
  ) {
    return null;
  }


  const validDataUrl =
    /^data:image\/(jpeg|jpg|png|webp);base64,/i;


  if (
    !validDataUrl.test(
      image
    )
  ) {
    throw new Error(
      'Unsupported camera image format.'
    );
  }


  /*
    Keep requests reasonable.

    The renderer sends a resized JPEG,
    so it should normally be much smaller.
  */

  if (
    image.length >
    12_000_000
  ) {
    throw new Error(
      'Camera image is too large.'
    );
  }


  return image;
}


/* ============================================================
   DASHBOARD CACHE
============================================================ */

async function cachedWeatherRequest(
  city: string
) {

  const now =
    Date.now();


  if (
    cachedWeather &&
    now -
      cachedWeatherTime <
      DASHBOARD_CACHE_MS
  ) {
    return cachedWeather;
  }


  try {
    cachedWeather =
      await weatherTool.execute(
        {
          city
        },

        {}
      );


    cachedWeatherTime =
      now;


    return cachedWeather;


  } catch (
    error
  ) {

    return {
      success:
        false,

      error:
        error instanceof Error
          ? error.message
          : String(
              error
            )
    };
  }
}


async function cachedNewsRequest() {

  const now =
    Date.now();


  if (
    cachedNews &&
    now -
      cachedNewsTime <
      DASHBOARD_CACHE_MS
  ) {
    return cachedNews;
  }


  try {
    cachedNews =
      await newsTool.execute(
        {
          limit:
            8
        },

        {}
      );


    cachedNewsTime =
      now;


    return cachedNews;


  } catch (
    error
  ) {

    return {
      success:
        false,

      error:
        error instanceof Error
          ? error.message
          : String(
              error
            )
    };
  }
}


/* ============================================================
   FASTIFY
============================================================ */

const app =
  Fastify(
    {
      logger:
        true,

      bodyLimit:
        15 * 1024 * 1024
    }
  );


/* ============================================================
   ROOT
============================================================ */

app.get(
  '/',

  async () => {

    return {
      name:
        'NOVA',

      creator:
        'Kartavya Singh',

      status:
        'online',

      version:
        '1.5.0',

      features: {
        chat:
          true,

        localWhisper:
          true,

        voice:
          true,

        cameraVision:
          true,

        liveVision:
          true
      }
    };
  }
);


/* ============================================================
   HEALTH
============================================================ */

app.get(
  '/health',

  async () => {

    return {
      status:
        'ok',

      name:
        'NOVA',

      creator:
        'Kartavya Singh',

      vision:
        'enabled',

      localVoice:
        'enabled'
    };
  }
);


/* ============================================================
   DASHBOARD
============================================================ */

app.get(
  '/dashboard',

  async () => {

    const dashboardCity =
      String(
        process.env
          .DASHBOARD_CITY ||

        process.env
          .WEATHER_CITY ||

        ''
      )
        .trim();


    const [
      systemResult,
      batteryResult,
      wifiResult,
      bluetoothResult
    ] =
      await Promise.allSettled(
        [
          systemTool.execute(
            {},
            {}
          ),

          batteryTool.execute(
            {},
            {}
          ),

          wifiTool.execute(
            {},
            {}
          ),

          bluetoothTool.execute(
            {},
            {}
          )
        ]
      );


    function unwrap(
      result:
        PromiseSettledResult<unknown>
    ) {

      if (
        result.status ===
          'fulfilled'
      ) {
        return result.value;
      }


      return {
        success:
          false,

        error:
          result.reason instanceof Error
            ? result.reason.message
            : String(
                result.reason
              )
      };
    }


    const [
      weather,
      news
    ] =
      await Promise.all(
        [
          dashboardCity

            ? cachedWeatherRequest(
                dashboardCity
              )

            : Promise.resolve(
                {
                  success:
                    false,

                  error:
                    'Dashboard weather location is not configured.'
                }
              ),

          cachedNewsRequest()
        ]
      );


    return {
      success:
        true,

      timestamp:
        new Date()
          .toISOString(),

      backend: {
        status:
          'online'
      },

      system:
        unwrap(
          systemResult
        ),

      battery:
        unwrap(
          batteryResult
        ),

      wifi:
        unwrap(
          wifiResult
        ),

      bluetooth:
        unwrap(
          bluetoothResult
        ),

      weather,

      news
    };
  }
);


/* ============================================================
   CLEAR HISTORY
============================================================ */

app.post(
  '/clear-history',

  async () => {

    await saveHistory(
      []
    );


    return {
      success:
        true,

      message:
        'NOVA chat history cleared.'
    };
  }
);


/* ============================================================
   CHAT
============================================================ */

app.post(
  '/chat',

  async (
    request,
    reply
  ) => {

    try {

      const body =
        request.body as ChatBody;


      const message =
        String(
          body?.message ??
          ''
        )
          .trim();


      if (
        !message
      ) {

        return reply
          .code(
            400
          )
          .send(
            {
              success:
                false,

              error:
                'Message is required.'
            }
          );
      }


      const voiceMode =
        body?.voiceMode ===
          true;


      const cameraImage =
        validateCameraImage(
          body?.image
        );


      /*
        This log proves whether the renderer
        actually sent a camera frame.
      */

      request.log.info(
        {
          voiceMode,

          visionReceived:
            Boolean(
              cameraImage
            ),

          imageDataLength:
            cameraImage
              ?.length ??
            0
        },

        'NOVA chat request'
      );


      const history =
        await loadHistory();


      const systemPromptParts = [
        'You are NOVA, a Windows desktop AI assistant.',

        'You were created by Kartavya Singh.',

        'If asked who made, created, built, or developed you, say you were created by Kartavya Singh.',

        '',

        'PERSONALITY:',

        '- Be natural, useful, confident, and concise.',

        '- Speak conversationally rather than sounding robotic.',

        voiceMode
          ? '- This is a spoken Live Voice conversation. Keep most replies short and natural.'
          : '- This is a normal text conversation.',

        '',

        'VISION RULES:'
      ];


      if (
        cameraImage
      ) {

        systemPromptParts.push(
          '- IMPORTANT: A current webcam image IS attached to the current user message.',

          '- You have access to that attached image for this request.',

          '- Inspect the actual image before answering.',

          '- Answer questions about visible objects, hands, colors, text, surroundings, or other visible details from the attached frame.',

          '- Do not say that you cannot analyze images when an image is attached.',

          '- Ignore any older assistant message claiming images cannot be analyzed; the current request includes a real image.',

          '- Do not invent things that are not clearly visible.',

          '- If part of the image is blurry, blocked, dark, or unclear, say specifically what is unclear.',

          '- Treat the image as a single current webcam frame, not continuous video.'
        );

      } else {

        systemPromptParts.push(
          '- No camera image is attached to this request.',

          '- Do not claim you can currently see through the webcam when there is no attached image.'
        );
      }


      systemPromptParts.push(
        '',

        'TOOLS:',

        '- Use available tools when useful.',

        '- Never claim a tool action succeeded unless its result confirms success.'
      );


      const systemPrompt =
        systemPromptParts.join(
          '\n'
        );


      let currentUser:
        OpenRouterMessage;


      if (
        cameraImage
      ) {

        /*
          OpenRouter multimodal format:

          text comes FIRST,
          image_url comes SECOND.
        */

        currentUser = {
          role:
            'user',

          content: [
            {
              type:
                'text',

              text:
                `${message}

A current webcam frame is attached to this message. Use the attached image when answering.`
            },

            {
              type:
                'image_url',

              image_url: {
                url:
                  cameraImage
              }
            }
          ]
        };


      } else {

        currentUser = {
          role:
            'user',

          content:
            message
        };
      }


      const historyMessages:
        OpenRouterMessage[] =
        history
          .slice(
            -20
          )
          .map(
            (
              item
            ): OpenRouterMessage => (
              {
                role:
                  item.role,

                content:
                  item.content
              }
            )
          );


      const messages:
        OpenRouterMessage[] =
        [
          {
            role:
              'system',

            content:
              systemPrompt
          },

          ...historyMessages,

          currentUser
        ];


      /*
        openrouter.ts automatically detects
        the image_url part.

        If an image exists:
          model = NOVA_VISION_MODEL
          OR openrouter/free

        If there is no image:
          model = OPENROUTER_MODEL
      */

      const firstResponse =
        await askOpenRouter(
          messages
        );


      let finalResponse =
        firstResponse;


      const toolCalls =
        firstResponse
          ?.tool_calls;


      /*
        Vision calls intentionally have no
        tool definitions in openrouter.ts.

        Normal text requests can still use
        NOVA's existing tools.
      */

      if (
        !cameraImage &&
        Array.isArray(
          toolCalls
        ) &&
        toolCalls.length >
          0
      ) {

        const toolMessages:
          OpenRouterMessage[] =
          [];


        for (
          const toolCall
          of toolCalls
        ) {

          const toolResult =
            await executeToolCall(
              toolCall
            );


          toolMessages.push(
            toolResult as OpenRouterMessage
          );
        }


        const secondMessages:
          OpenRouterMessage[] =
          [
            ...messages,

            {
              role:
                'assistant',

              content:
                firstResponse
                  ?.content ??
                null,

              tool_calls:
                toolCalls
            },

            ...toolMessages
          ];


        finalResponse =
          await askOpenRouter(
            secondMessages
          );
      }


      const answer =
        typeof finalResponse
          ?.content ===
          'string'

          ? finalResponse
              .content
              .trim()

          : 'NOVA completed the request.';


      if (
        !answer
      ) {
        throw new Error(
          'NOVA returned an empty response.'
        );
      }


      const savedUserMessage =
        cameraImage

          ? `${message} [current webcam frame attached]`

          : message;


      const userHistoryEntry:
        StoredMessage =
        {
          role:
            'user',

          content:
            savedUserMessage
        };


      const assistantHistoryEntry:
        StoredMessage =
        {
          role:
            'assistant',

          content:
            answer
        };


      const updatedHistory:
        StoredMessage[] =
        [
          ...history,

          userHistoryEntry,

          assistantHistoryEntry
        ]
          .slice(
            -60
          );


      await saveHistory(
        updatedHistory
      );


      request.log.info(
        {
          visionReceived:
            Boolean(
              cameraImage
            ),

          voiceMode,

          answerLength:
            answer.length
        },

        'NOVA response complete'
      );


      return {
        success:
          true,

        /*
          Kept because your renderer already
          checks this property.
        */

        visionUsed:
          Boolean(
            cameraImage
          ),

        visionReceived:
          Boolean(
            cameraImage
          ),

        voiceMode,

        response:
          finalResponse
      };


    } catch (
      error
    ) {

      request.log.error(
        error
      );


      return reply
        .code(
          500
        )
        .send(
          {
            success:
              false,

            error:
              'NOVA request failed.',

            details:
              error instanceof Error
                ? error.message
                : String(
                    error
                  )
          }
        );
    }
  }
);


/* ============================================================
   START SERVER
============================================================ */

async function start() {

  await app.register(
    cors,

    {
      origin:
        true
    }
  );


  const port =
    Number(
      process.env.PORT ||
      3000
    );


  await app.listen(
    {
      host:
        '127.0.0.1',

      port
    }
  );


  console.log(
    ''
  );

  console.log(
    '=============================================='
  );

  console.log(
    `NOVA backend: http://127.0.0.1:${port}`
  );

  console.log(
    'Normal AI: OpenRouter configured model'
  );

  console.log(
    'Vision AI: OpenRouter vision-capable route'
  );

  console.log(
    'Speech recognition: Local faster-whisper'
  );

  console.log(
    'Speech output: Windows TTS'
  );

  console.log(
    '=============================================='
  );
}


start()
  .catch(
    error => {

      console.error(
        'NOVA failed to start:',
        error
      );


      process.exit(
        1
      );
    }
  );