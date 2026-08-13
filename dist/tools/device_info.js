"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceInfoTool = void 0;
const node_child_process_1 = require("node:child_process");
const node_util_1 = require("node:util");
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
exports.deviceInfoTool = {
    name: 'get_device_info',
    description: 'Get read-only information available from Android through Termux:API, including cellular/network and SIM information.',
    permission: 'read_only',
    parameters: {
        type: 'object',
        properties: {},
        required: []
    },
    async execute() {
        try {
            const { stdout } = await execFileAsync('termux-telephony-deviceinfo', [], { timeout: 10000 });
            const info = JSON.parse(stdout);
            return {
                success: true,
                device: 'Android',
                info
            };
        }
        catch (error) {
            return {
                success: false,
                device: 'Android',
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
};
