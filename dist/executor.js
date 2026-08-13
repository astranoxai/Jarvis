"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeToolCall = executeToolCall;
const time_js_1 = require("./tools/time.js");
const calculator_js_1 = require("./tools/calculator.js");
const system_js_1 = require("./tools/system.js");
const weather_js_1 = require("./tools/weather.js");
const web_search_js_1 = require("./tools/web_search.js");
const memory_js_1 = require("./tools/memory.js");
const battery_js_1 = require("./tools/battery.js");
const set_alarm_js_1 = require("./tools/set_alarm.js");
const send_email_js_1 = require("./tools/send_email.js");
const read_emails_js_1 = require("./tools/read_emails.js");
const read_email_js_1 = require("./tools/read_email.js");
const location_js_1 = require("./tools/location.js");
const wifi_js_1 = require("./tools/wifi.js");
const volume_js_1 = require("./tools/volume.js");
const set_volume_js_1 = require("./tools/set_volume.js");
const device_info_js_1 = require("./tools/device_info.js");
const browser_js_1 = require("./tools/browser.js");
const read_webpage_js_1 = require("./tools/read_webpage.js");
const browser_navigation_js_1 = require("./tools/browser_navigation.js");
async function executeToolCall(toolCall, context = {}) {
    const args = JSON.parse(toolCall.function.arguments || '{}');
    let result;
    switch (toolCall.function.name) {
        case 'get_current_time':
            result = await time_js_1.timeTool.execute(args, context);
            break;
        case 'calculate':
            result = await calculator_js_1.calculatorTool.execute(args, context);
            break;
        case 'get_system_info':
            result = await system_js_1.systemTool.execute(args, context);
            break;
        case 'get_weather':
            result = await weather_js_1.weatherTool.execute(args, context);
            break;
        case 'web_search':
            result = await web_search_js_1.webSearchTool.execute(args, context);
            break;
        case 'remember':
            result = await memory_js_1.memoryTool.execute(args, context);
            break;
        case 'recall':
            result = await memory_js_1.recallTool.execute(args, context);
            break;
        case 'list_memories':
            result = await memory_js_1.listMemoriesTool.execute(args, context);
            break;
        case 'forget_memory':
            result = await memory_js_1.forgetMemoryTool.execute(args, context);
            break;
        case 'get_battery_status':
            result = await battery_js_1.batteryTool.execute(args, context);
            break;
        case 'set_alarm':
            result = await set_alarm_js_1.setAlarmTool.execute(args, context);
            break;
        case 'send_email':
            result = await send_email_js_1.sendEmailTool.execute(args, context);
            break;
        case 'read_emails':
            result = await read_emails_js_1.readEmailsTool.execute(args, context);
            break;
        case 'read_email':
            result = await read_email_js_1.readEmailTool.execute(args, context);
            break;
        case 'get_location':
            result = await location_js_1.locationTool.execute(args, context);
            break;
        case 'get_wifi_status':
            result = await wifi_js_1.wifiTool.execute(args, context);
            break;
        case 'get_volume_status':
            result = await volume_js_1.volumeTool.execute(args, context);
            break;
        case 'set_volume':
            result = await set_volume_js_1.setVolumeTool.execute(args, context);
            break;
        case 'get_device_info':
            result = await device_info_js_1.deviceInfoTool.execute(args, context);
            break;
        case 'open_browser':
            result = await browser_js_1.browserTool.execute(args, context);
            break;
        case 'browser_search':
            result = await browser_js_1.browserSearchTool.execute(args, context);
            break;
        case 'read_webpage':
            result = await read_webpage_js_1.readWebpageTool.execute(args, context);
            break;
        case 'browser_back':
            result = await browser_navigation_js_1.browserBackTool.execute(args, context);
            break;
        case 'browser_forward':
            result = await browser_navigation_js_1.browserForwardTool.execute(args, context);
            break;
        default:
            throw new Error(`Unknown tool: ${toolCall.function.name}`);
    }
    return {
        tool_call_id: toolCall.id,
        role: 'tool',
        name: toolCall.function.name,
        content: JSON.stringify(result)
    };
}
