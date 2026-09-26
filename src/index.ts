import 'dotenv/config';

import Fastify from 'fastify';
import cors from '@fastify/cors';

import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  askOpenRouter,
  type OpenRouterMessage
} from './orchestrator/openrouter.js';

import { executeToolCall } from './executor.js';

import { systemTool } from './tools/system.js';
import { batteryTool } from './tools/battery.js';
import { wifiTool } from './tools/wifi.js';
import { bluetoothTool } from './tools/bluetooth.js';
import { weatherTool } from './tools/weather.js';
import { newsTool } from './tools/news.js';

const historyFile =
  path.resolve(
    'data/chat_history.json'
  );

type StoredMessage = {
  role:
    | 'user'
    | 'assistant';

  content: string;
};

type ChatBody = {
  message?: unknown;
  image?: unknown;
};

const DASHBOARD_EXTERNAL_CACHE_MS =
  5 * 60 * 1000;

let cachedWeather:
  unknown = null;

let cachedWeatherTime =
  0;

let cachedNews:
  unknown = null;

let cachedNewsTime =
  0;

/* =========================================
   HISTORY
========================================= */

async function loadHistory():
Promise<StoredMessage[]> {
  try {
    const raw =
      await fs.readFile(
        historyFile,
        'utf8'
      );

    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (message: any) =>
        (
          message?.role === 'user' ||
          message?.role === 'assistant'
        ) &&
        typeof message?.content === 'string'
    );

  } catch {
    return [];
  }
}

async function saveHistory(
  history: StoredMessage[]
) {
  const cleanHistory =
    history.filter(
      message =>
        (
          message.role === 'user' ||
          message.role === 'assistant'
        ) &&
        typeof message.content === 'string'
    );

  await fs.mkdir(
    path.dirname(historyFile),
    {
      recursive: true
    }
  );

  await fs.writeFile(
    historyFile,
    JSON.stringify(
      cleanHistory,
      null,
      2
    ),
    'utf8'
  );
}

/* =========================================
   CAMERA IMAGE VALIDATION
========================================= */

function validateCameraImage(
  image: unknown
): string | null {
  if (
    typeof image !== 'string'
  ) {
    return null;
  }

  const trimmed =
    image.trim();

  if (!trimmed) {
    return null;
  }

  const validDataUrl =
    /^data:image\/(jpeg|jpg|png|webp);base64,/i;

  if (
    !validDataUrl.test(
      trimmed
    )
  ) {
    throw new Error(
      'Invalid camera image format.'
    );
  }

  const MAX_IMAGE_LENGTH =
    8_000_000;

  if (
    trimmed.length >
    MAX_IMAGE_LENGTH
  ) {
    throw new Error(
      'Camera image is too large.'
    );
  }

  return trimmed;
}

/* =========================================
   SERVER
========================================= */

const app =
  Fastify({
    logger: true,
    bodyLimit:
      10 * 1024 * 1024
  });

/* =========================================
   ROOT
========================================= */

app.get(
  '/',
  async () => {
    return {
      name: 'NOVA',
      creator: 'Kartavya Singh',
      status: 'online',
      version: '1.1.0',
      vision: true
    };
  }
);

/* =========================================
   HEALTH
========================================= */

app.get(
  '/health',
  async () => {
    return {
      status: 'ok',
      name: 'NOVA',
      creator: 'Kartavya Singh'
    };
  }
);

/* =========================================
   DASHBOARD EXTERNAL DATA
========================================= */

async function getDashboardWeather(
  city: string
) {
  const now =
    Date.now();

  if (
    cachedWeather &&
    now - cachedWeatherTime <
      DASHBOARD_EXTERNAL_CACHE_MS
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

  } catch (error) {
    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : String(error)
    };
  }
}

async function getDashboardNews() {
  const now =
    Date.now();

  if (
    cachedNews &&
    now - cachedNewsTime <
      DASHBOARD_EXTERNAL_CACHE_MS
  ) {
    return cachedNews;
  }

  try {
    cachedNews =
      await newsTool.execute(
        {
          limit: 8
        },
        {}
      );

    cachedNewsTime =
      now;

    return cachedNews;

  } catch (error) {
    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : String(error)
    };
  }
}

/* =========================================
   LIVE DASHBOARD
========================================= */

app.get(
  '/dashboard',
  async () => {
    const dashboardCity =
      String(
        process.env.DASHBOARD_CITY ||
        process.env.WEATHER_CITY ||
        ''
      ).trim();

    const [
      systemResult,
      batteryResult,
      wifiResult,
      bluetoothResult
    ] =
      await Promise.allSettled([
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
      ]);

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
        success: false,

        error:
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason)
      };
    }

    const [
      weatherResult,
      newsResult
    ] =
      await Promise.all([
        dashboardCity
          ? getDashboardWeather(
              dashboardCity
            )
          : Promise.resolve({
              success: false,

              error:
                'DASHBOARD_CITY is not configured.'
            }),

        getDashboardNews()
      ]);

    return {
      success: true,

      timestamp:
        new Date()
          .toISOString(),

      backend: {
        status: 'online',
        vision: true
      },

      system:
        unwrap(systemResult),

      battery:
        unwrap(batteryResult),

      wifi:
        unwrap(wifiResult),

      bluetooth:
        unwrap(bluetoothResult),

      weather:
        weatherResult,

      news:
        newsResult
    };
  }
);

/* =========================================
   CLEAR HISTORY
========================================= */

app.post(
  '/clear-history',
  async () => {
    await saveHistory([]);

    return {
      success: true,

      message:
        'Nova chat history cleared.'
    };
  }
);

/* =========================================
   CHAT
========================================= */

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
        ).trim();

      if (!message) {
        return reply
          .code(400)
          .send({
            success: false,

            error:
              'Message is required.'
          });
      }

      const cameraImage =
        validateCameraImage(
          body?.image
        );

      const history =
        await loadHistory();

      const systemPrompt =
        [
          'You are NOVA, a capable Windows desktop AI assistant.',

          'You were created by Kartavya Singh.',

          'If asked who created, built, made, or developed you, answer that you were created by Kartavya Singh.',

          '',

          'You run as part of a Windows desktop assistant application.',

          '',

          'Vision rules:',

          '- When an image is attached to the current user message, you may analyze that image.',

          '- An attached image may be a live snapshot from the user-selected webcam.',

          '- Only claim you can see something when an image is actually attached to the current message.',

          '- If no image is attached, do not claim that you can currently see through the camera.',

          '- Describe only what is reasonably visible in the supplied image.',

          '- Do not claim that the camera is continuously recording or continuously visible to you.',

          '',

          'Use tools whenever they are useful.',

          '',

          'Tool rules:',

          '- For current time, use get_current_time.',

          '- For calculations, use calculate.',

          '- For live system information, use get_system_info.',

          '- For battery information, use get_battery_status.',

          '- For Wi-Fi information, use get_wifi_status.',

          '- For Bluetooth information, use get_bluetooth_status.',

          '- For current weather, use get_weather.',

          '- For current news headlines, use get_news.',

          '- For recent or current information from the web, use web_search.',

          '- For memory requests, use the memory tools.',

          '- For email sending, use send_email only when the user explicitly asks to send an email.',

          '- For reading email, use read_emails or read_email.',

          '- For browser actions, use open_browser or browser_search.',

          '',

          'Do not claim a tool action succeeded unless the tool result says it succeeded.',

          '',

          'Be concise and helpful.'
        ]
          .join('\n');

      let currentUserMessage:
        OpenRouterMessage;

      if (cameraImage) {
        currentUserMessage = {
          role: 'user',

          content: [
            {
              type: 'text',

              text: message
            },

            {
              type: 'image_url',

              image_url: {
                url: cameraImage
              }
            }
          ]
        };

      } else {
        currentUserMessage = {
          role: 'user',

          content: message
        };
      }

      const messages:
        OpenRouterMessage[] =
        [
          {
            role: 'system',

            content:
              systemPrompt
          },

          ...history
            .slice(-20)
            .map(
              stored => ({
                role:
                  stored.role,

                content:
                  stored.content
              })
            ),

          currentUserMessage
        ];

      const firstResponse:
        any =
        await askOpenRouter(
          messages
        );

      const toolCalls =
        firstResponse
          ?.tool_calls;

      let finalResponse =
        firstResponse;

      if (
        Array.isArray(
          toolCalls
        ) &&
        toolCalls.length > 0
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
              role: 'assistant',

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
          ? finalResponse.content
          : 'Nova completed the request.';

      const historyUserText =
        cameraImage
          ? `${message} [camera image attached]`
          : message;

      const updatedHistory:
        StoredMessage[] =
        [
          ...history,

          {
            role: 'user',

            content:
              historyUserText
          },

          {
            role:
              'assistant',

            content:
              answer
          }
        ];

      await saveHistory(
        updatedHistory
      );

      return {
        success: true,

        visionUsed:
          Boolean(
            cameraImage
          ),

        response:
          finalResponse
      };

    } catch (error) {
      request.log.error(
        error
      );

      return reply
        .code(500)
        .send({
          success: false,

          error:
            'NOVA AI request failed',

          details:
            error instanceof Error
              ? error.message
              : String(error)
        });
    }
  }
);

/* =========================================
   START
========================================= */

async function main() {
  await app.register(
    cors,
    {
      origin: true
    }
  );

  const port =
    Number(
      process.env.PORT ||
      3000
    );

  const host =
    process.env.HOST ||
    '0.0.0.0';

  await app.listen({
    port,
    host
  });

  console.log(
    `NOVA running on http://${host}:${port}`
  );
}

main().catch(
  error => {
    console.error(
      'Failed to start NOVA:',
      error
    );

    process.exit(1);
  }
);