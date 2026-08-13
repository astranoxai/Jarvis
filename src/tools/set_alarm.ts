import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ToolDefinition } from './types.js';

const execFileAsync = promisify(execFile);

export const setAlarmTool: ToolDefinition = {
  name: 'set_alarm',

  description:
    'Create an Android alarm using the Samsung Clock app through Android SET_ALARM. Use this when the user explicitly asks to set an alarm. Time uses 24-hour hour/minute values. A request such as "7:00 AM tomorrow" should use hour 7 and minute 0. The Android Clock app handles the alarm scheduling.',

  permission: 'write_low_risk',

  parameters: {
    type: 'object',
    properties: {
      hour: {
        type: 'integer',
        minimum: 0,
        maximum: 23,
        description: 'Alarm hour in 24-hour format.'
      },
      minute: {
        type: 'integer',
        minimum: 0,
        maximum: 59,
        description: 'Alarm minute.'
      },
      message: {
        type: 'string',
        description: 'Optional alarm label.'
      }
    },
    required: ['hour', 'minute']
  },

  async execute(args) {
    const hour = args.hour;
    const minute = args.minute;
    const message =
      typeof args.message === 'string' && args.message.trim()
        ? args.message.trim()
        : 'JARVIS Alarm';

    if (
      typeof hour !== 'number' ||
      !Number.isInteger(hour) ||
      hour < 0 ||
      hour > 23
    ) {
      return {
        success: false,
        error: 'Hour must be a whole number from 0 to 23.'
      };
    }

    if (
      typeof minute !== 'number' ||
      !Number.isInteger(minute) ||
      minute < 0 ||
      minute > 59
    ) {
      return {
        success: false,
        error: 'Minute must be a whole number from 0 to 59.'
      };
    }

    try {
      await execFileAsync(
        'am',
        [
          'start',
          '--user',
          '0',
          '-a',
          'android.intent.action.SET_ALARM',
          '--es',
          'android.intent.extra.alarm.MESSAGE',
          message,
          '--ei',
          'android.intent.extra.alarm.HOUR',
          String(hour),
          '--ei',
          'android.intent.extra.alarm.MINUTES',
          String(minute)
        ],
        {
          timeout: 10000
        }
      );

      return {
        success: true,
        device: 'Android',
        alarm: {
          hour,
          minute,
          message
        }
      };
    } catch (error) {
      return {
        success: false,
        device: 'Android',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
};
