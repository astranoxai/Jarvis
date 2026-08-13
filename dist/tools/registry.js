"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTools = getTools;
exports.getTool = getTool;
const time_js_1 = require("./time.js");
const calculator_js_1 = require("./calculator.js");
const system_js_1 = require("./system.js");
const weather_js_1 = require("./weather.js");
const web_search_js_1 = require("./web_search.js");
const memory_js_1 = require("./memory.js");
const battery_js_1 = require("./battery.js");
const set_alarm_js_1 = require("./set_alarm.js");
const send_email_js_1 = require("./send_email.js");
const read_emails_js_1 = require("./read_emails.js");
const read_email_js_1 = require("./read_email.js");
const location_js_1 = require("./location.js");
const wifi_js_1 = require("./wifi.js");
const volume_js_1 = require("./volume.js");
const set_volume_js_1 = require("./set_volume.js");
const device_info_js_1 = require("./device_info.js");
const browser_js_1 = require("./browser.js");
const read_webpage_js_1 = require("./read_webpage.js");
const browser_navigation_js_1 = require("./browser_navigation.js");
const tools = [
    time_js_1.timeTool,
    calculator_js_1.calculatorTool,
    system_js_1.systemTool,
    weather_js_1.weatherTool,
    web_search_js_1.webSearchTool,
    memory_js_1.memoryTool,
    memory_js_1.recallTool,
    memory_js_1.listMemoriesTool,
    memory_js_1.forgetMemoryTool,
    battery_js_1.batteryTool,
    set_alarm_js_1.setAlarmTool,
    send_email_js_1.sendEmailTool,
    read_emails_js_1.readEmailsTool,
    read_email_js_1.readEmailTool,
    location_js_1.locationTool,
    wifi_js_1.wifiTool,
    volume_js_1.volumeTool,
    set_volume_js_1.setVolumeTool,
    device_info_js_1.deviceInfoTool,
    browser_js_1.browserTool,
    browser_js_1.browserSearchTool,
    read_webpage_js_1.readWebpageTool,
    browser_navigation_js_1.browserBackTool,
    browser_navigation_js_1.browserForwardTool
];
function getTools() {
    return tools;
}
function getTool(name) {
    return tools.find((tool) => tool.name === name);
}
