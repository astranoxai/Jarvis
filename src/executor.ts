import { timeTool } from './tools/time.js';
import { calculatorTool } from './tools/calculator.js';
import { systemTool } from './tools/system.js';
import { weatherTool } from './tools/weather.js';
import { webSearchTool } from './tools/web_search.js';
import { newsTool } from './tools/news.js';

import {
  memoryTool,
  recallTool,
  listMemoriesTool,
  forgetMemoryTool
} from './tools/memory.js';

import { batteryTool } from './tools/battery.js';
import { setAlarmTool } from './tools/set_alarm.js';

import { sendEmailTool } from './tools/send_email.js';
import { readEmailsTool } from './tools/read_emails.js';
import { readEmailTool } from './tools/read_email.js';

import { locationTool } from './tools/location.js';

import { wifiTool } from './tools/wifi.js';
import { bluetoothTool } from './tools/bluetooth.js';

import { volumeTool } from './tools/volume.js';
import { setVolumeTool } from './tools/set_volume.js';

import { deviceInfoTool } from './tools/device_info.js';

import {
  browserTool,
  browserSearchTool
} from './tools/browser.js';

import { readWebpageTool } from './tools/read_webpage.js';

import {
  browserBackTool,
  browserForwardTool
} from './tools/browser_navigation.js';

export async function executeToolCall(
  toolCall: any
) {
  const name =
    toolCall?.function?.name;

  let args: Record<string, any> = {};

  try {
    args =
      JSON.parse(
        toolCall?.function?.arguments ||
        '{}'
      );
  } catch {
    args = {};
  }

  let result: unknown;

  switch (name) {

    case 'get_current_time':
      result = await timeTool.execute(args, {});
      break;

    case 'calculate':
      result = await calculatorTool.execute(args, {});
      break;

    case 'get_system_info':
      result = await systemTool.execute(args, {});
      break;

    case 'get_weather':
      result = await weatherTool.execute(args, {});
      break;

    case 'web_search':
      result = await webSearchTool.execute(args, {});
      break;

    case 'get_news':
      result = await newsTool.execute(args, {});
      break;

    case 'remember':
      result = await memoryTool.execute(args, {});
      break;

    case 'recall':
      result = await recallTool.execute(args, {});
      break;

    case 'list_memories':
      result = await listMemoriesTool.execute(args, {});
      break;

    case 'forget_memory':
      result = await forgetMemoryTool.execute(args, {});
      break;

    case 'get_battery_status':
      result = await batteryTool.execute(args, {});
      break;

    case 'set_alarm':
      result = await setAlarmTool.execute(args, {});
      break;

    case 'send_email':
      result = await sendEmailTool.execute(args, {});
      break;

    case 'read_emails':
      result = await readEmailsTool.execute(args, {});
      break;

    case 'read_email':
      result = await readEmailTool.execute(args, {});
      break;

    case 'get_location':
      result = await locationTool.execute(args, {});
      break;

    case 'get_wifi_status':
      result = await wifiTool.execute(args, {});
      break;

    case 'get_bluetooth_status':
      result = await bluetoothTool.execute(args, {});
      break;

    case 'get_volume_status':
      result = await volumeTool.execute(args, {});
      break;

    case 'set_volume':
      result = await setVolumeTool.execute(args, {});
      break;

    case 'get_device_info':
      result = await deviceInfoTool.execute(args, {});
      break;

    case 'open_browser':
      result = await browserTool.execute(args, {});
      break;

    case 'browser_search':
      result = await browserSearchTool.execute(args, {});
      break;

    case 'read_webpage':
      result = await readWebpageTool.execute(args, {});
      break;

    case 'browser_back':
      result = await browserBackTool.execute(args, {});
      break;

    case 'browser_forward':
      result = await browserForwardTool.execute(args, {});
      break;

    default:
      result = {
        success: false,
        error: `Unknown Nova tool: ${name}`
      };
  }

  return {
    tool_call_id:
      toolCall.id,

    role:
      'tool',

    name,

    content:
      JSON.stringify(result)
  };
}