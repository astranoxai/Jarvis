import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ToolDefinition } from './types.js';

const execFileAsync = promisify(execFile);

const allowedStreams = [
  'call',
  'system',
  'ring',
  'music',
  'alarm',
  'notification'
] as const;

type VolumeStream = typeof allowedStreams[number];

export const setVolumeTool: ToolDefinition = {
  name: 'set_volume',
  description:
    'Change the Android volume for a specific audio stream using Termux:API. Allowed streams: call, system, ring, music, alarm, notification. Volume must be a whole number from 0 to 15.',
  permission: 'write_low_risk',

  parameters: {
    type: 'object',
    properties: {
      stream: {
        type: 'string',
        enum: [...allowedStreams],
        description: 'Android audio stream to change.'
      },
      volume: {
        type: 'integer',
        minimum: 0,
        maximum: 15,
        description: 'Volume level from 0 to 15.'
      }
    },
    required: ['stream', 'volume']
  },

  async execute(args) {
    const stream = args.stream as VolumeStream;
    const volume = args.volume;

    if (!allowedStreams.includes(stream)) {
      return {
        success: false,
        error: `Invalid stream. Allowed streams: ${allowedStreams.join(', ')}`
      };
    }

    if (
      typeof volume !== 'number' ||
      !Number.isInteger(volume) ||
      volume < 0 ||
      volume > 15
    ) {
      return {
        success: false,
        error: 'Volume must be a whole number from 0 to 15.'
      };
    }

    try {
      await execFileAsync(
        'termux-volume',
        [stream, String(volume)],
        { timeout: 10000 }
      );

      return {
        success: true,
        device: 'Android',
        stream,
        volume
      };
    } catch (error) {
      return {
        success: false,
        device: 'Android',
        stream,
        volume,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
};
