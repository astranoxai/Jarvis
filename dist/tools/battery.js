"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batteryTool = void 0;
const node_child_process_1 = require("node:child_process");
const node_util_1 = require("node:util");
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
exports.batteryTool = {
    name: 'get_battery_status',
    description: 'Get the current Android device battery status, including percentage, charging state, health, temperature, voltage, and battery current.',
    permission: 'read_only',
    parameters: {
        type: 'object',
        properties: {},
        required: []
    },
    async execute() {
        const { stdout } = await execFileAsync('termux-battery-status', [], { timeout: 5000 });
        return {
            success: true,
            device: 'Android',
            battery: JSON.parse(stdout)
        };
    }
};
