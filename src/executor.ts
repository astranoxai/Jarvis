import { timeTool } from './tools/time.js';
import { calculatorTool } from './tools/calculator.js';
import { systemTool } from './tools/system.js';
import { weatherTool } from './tools/weather.js';
import { webSearchTool } from './tools/web_search.js';
import { memoryTool, recallTool, listMemoriesTool, forgetMemoryTool } from './tools/memory.js';
import { batteryTool } from './tools/battery.js';
import { setAlarmTool } from './tools/set_alarm.js';
import { sendEmailTool } from './tools/send_email.js';
import { readEmailsTool } from './tools/read_emails.js';
import { readEmailTool } from './tools/read_email.js';
import { locationTool } from './tools/location.js';
import { wifiTool } from './tools/wifi.js';
import { volumeTool } from './tools/volume.js';
import { setVolumeTool } from './tools/set_volume.js';
import { deviceInfoTool } from './tools/device_info.js';
import { browserTool, browserSearchTool } from './tools/browser.js';
import { readWebpageTool } from './tools/read_webpage.js';
import { browserBackTool, browserForwardTool } from './tools/browser_navigation.js';
import { ToolContext } from './tools/types.js';

type ToolCall = {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
};

export async function executeToolCall(
  toolCall: ToolCall,
  context: ToolContext = {}
) {
  const args = JSON.parse(
    toolCall.function.arguments || '{}'
  );

  let result: unknown;

  switch (toolCall.function.name) {
    case 'get_current_time':
      result = await timeTool.execute(args, context);
      break;

    case 'calculate':
      result = await calculatorTool.execute(args, context);
      break;

    case 'get_system_info':
      result = await systemTool.execute(args, context);
      break;

    case 'get_weather':
      result = await weatherTool.execute(args, context);
      break;

    case 'web_search':
      result = await webSearchTool.execute(args, context);
      break;

    case 'remember':
      result = await memoryTool.execute(args, context);
      break;

    case 'recall':
      result = await recallTool.execute(args, context);
      break;

    case 'list_memories':
      result = await listMemoriesTool.execute(args, context);
      break;

    case 'forget_memory':
      result = await forgetMemoryTool.execute(args, context);
      break;

    case 'get_battery_status':
      result = await batteryTool.execute(args, context);
      break;

    case 'set_alarm':
      result = await setAlarmTool.execute(args, context);
      break;

    case 'send_email':
      result = await sendEmailTool.execute(args, context);
      break;
    case 'read_emails':
      result = await readEmailsTool.execute(args, context);
      break;
    case 'read_email':
      result = await readEmailTool.execute(args, context);
      break;

    case 'get_location':
      result = await locationTool.execute(args, context);
      break;

    case 'get_wifi_status':
      result = await wifiTool.execute(args, context);
      break;

    case 'get_volume_status':
      result = await volumeTool.execute(args, context);
      break;

    case 'set_volume':
      result = await setVolumeTool.execute(args, context);
      break;

    case 'get_device_info':
      result = await deviceInfoTool.execute(args, context);
      break;
    case 'open_browser':
      result = await browserTool.execute(args, context);
      break;

    case 'browser_search':
      result = await browserSearchTool.execute(args, context);
      break;
    case 'read_webpage':
      result = await readWebpageTool.execute(args, context);
      break;
    case 'browser_back':
      result = await browserBackTool.execute(args, context);
      break;

    case 'browser_forward':
      result = await browserForwardTool.execute(args, context);
      break;

    default:
      throw new Error(
        `Unknown tool: ${toolCall.function.name}`
      );
  }

  return {
    tool_call_id: toolCall.id,
    role: 'tool',
    name: toolCall.function.name,
    content: JSON.stringify(result)
  };
}
