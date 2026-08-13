import { ToolDefinition } from './types.js';
import { timeTool } from './time.js';
import { calculatorTool } from './calculator.js';
import { systemTool } from './system.js';
import { weatherTool } from './weather.js';
import { webSearchTool } from './web_search.js';
import { memoryTool, recallTool, listMemoriesTool, forgetMemoryTool } from './memory.js';
import { batteryTool } from './battery.js';
import { setAlarmTool } from './set_alarm.js';
import { sendEmailTool } from './send_email.js';
import { readEmailsTool } from './read_emails.js';
import { readEmailTool } from './read_email.js';
import { locationTool } from './location.js';
import { wifiTool } from './wifi.js';
import { volumeTool } from './volume.js';
import { setVolumeTool } from './set_volume.js';
import { deviceInfoTool } from './device_info.js';
import { browserTool, browserSearchTool } from './browser.js';
import { readWebpageTool } from './read_webpage.js';
import { browserBackTool, browserForwardTool } from './browser_navigation.js';

const tools: ToolDefinition[] = [
  timeTool,
  calculatorTool,
  systemTool,
  weatherTool,
  webSearchTool,
  memoryTool,
  recallTool,
  listMemoriesTool,
  forgetMemoryTool,
  batteryTool,
  setAlarmTool,
  sendEmailTool,
  readEmailsTool,
  readEmailTool,
  locationTool,
  wifiTool,
  volumeTool,
  setVolumeTool,
  deviceInfoTool,
  browserTool,
  browserSearchTool,
  readWebpageTool,
  browserBackTool,
  browserForwardTool
];

export function getTools(): ToolDefinition[] {
  return tools;
}

export function getTool(name: string): ToolDefinition | undefined {
  return tools.find((tool: ToolDefinition) => tool.name === name);
}
