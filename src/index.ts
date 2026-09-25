import 'dotenv/config';

import Fastify from 'fastify';
import cors from '@fastify/cors';

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { askOpenRouter } from './orchestrator/openrouter.js';
import { executeToolCall } from './executor.js';

import { systemTool } from './tools/system.js';
import { batteryTool } from './tools/battery.js';
import { wifiTool } from './tools/wifi.js';
import { bluetoothTool } from './tools/bluetooth.js';
import { weatherTool } from './tools/weather.js';

const historyFile =
  path.resolve(
    'data/chat_history.json'
  );

type Message = {
  role:
    | 'system'
    | 'user'
    | 'assistant'
    | 'tool';

  content?:
    string | null;

  name?:
    string;

  tool_call_id?:
    string;

  tool_calls?:
    any[];
};

/* =========================================
   HISTORY
========================================= */

async function loadHistory():
Promise<Message[]> {
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
          message?.role ===
          'user' ||
          message?.role ===
          'assistant'
        ) &&
        typeof message?.content ===
        'string'
    );

  } catch {
    return [];
  }
}

async function saveHistory(
  history: Message[]
) {
  const cleanHistory =
    history.filter(
      (message) =>
        (
          message.role ===
          'user' ||
          message.role ===
          'assistant'
        ) &&
        typeof message.content ===
        'string'
    );

  await fs.mkdir(
    path.dirname(
      historyFile
    ),
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
   SERVER
========================================= */

const app =
  Fastify({
    logger: true
  });

/* =========================================
   ROOT
========================================= */

app.get(
  '/',
  async () => {
    return {
      name: 'NOVA',
      status: 'online',
      version: '1.0.0'
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
      status: 'ok'
    };
  }
);

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

    let weatherResult:
      unknown = null;

    if (dashboardCity) {
      try {
        weatherResult =
          await weatherTool.execute(
            {
              city:
                dashboardCity
            },
            {}
          );

      } catch (error) {
        weatherResult = {
          success: false,

          error:
            error instanceof Error
              ? error.message
              : String(error)
        };
      }
    }

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
            : String(
                result.reason
              )
      };
    }

    return {
      success: true,

      timestamp:
        new Date()
          .toISOString(),

      backend: {
        status: 'online'
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

      weather:
        dashboardCity
          ? weatherResult
          : {
              success: false,

              error:
                'DASHBOARD_CITY is not configured.'
            }
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
        request.body as {
          message?: unknown;
        };

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

      const history =
        await loadHistory();

      const messages:
        Message[] = [
          {
            role:
              'system',

            content:
              [
                'You are NOVA, a capable Windows desktop AI assistant.',
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
                '- For recent or current information from the web, use web_search.',
                '- For memory requests, use the memory tools.',
                '- For email sending, use send_email only when the user explicitly asks to send an email.',
                '- For reading email, use read_emails or read_email.',
                '- For browser actions, use open_browser or browser_search.',
                '',
                'Do not claim a tool action succeeded unless the tool result says it succeeded.',
                '',
                'Be concise and helpful.'
              ].join('\n')
          },

          ...history.slice(
            -20
          ),

          {
            role:
              'user',

            content:
              message
          }
        ];

      const firstResponse:
        any =
        await askOpenRouter(
          messages as any
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
        toolCalls.length >
        0
      ) {

        const toolMessages:
          Message[] = [];

        for (
          const toolCall
          of toolCalls
        ) {
          const toolResult =
            await executeToolCall(
              toolCall
            );

          toolMessages.push(
            toolResult as Message
          );
        }

        const secondMessages:
          Message[] = [
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
            secondMessages as any
          );
      }

      const answer =
        typeof finalResponse
          ?.content ===
        'string'
          ? finalResponse
              .content
          : 'Nova completed the request.';

      const updatedHistory:
        Message[] = [
          ...history,

          {
            role:
              'user',

            content:
              message
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
  (error) => {
    console.error(
      'Failed to start NOVA:',
      error
    );

    process.exit(1);
  }
);