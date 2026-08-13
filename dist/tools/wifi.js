"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wifiTool = void 0;
const node_child_process_1 = require("node:child_process");
const node_util_1 = require("node:util");
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
exports.wifiTool = {
    name: 'get_wifi_status',
    description: 'Get the Android device current Wi-Fi connection information using Termux:API. Read-only device information.',
    permission: 'read_only',
    parameters: {
        type: 'object',
        properties: {},
        required: []
    },
    async execute() {
        try {
            const { stdout } = await execFileAsync('termux-wifi-connectioninfo', [], { timeout: 10000 });
            const wifi = JSON.parse(stdout);
            return {
                success: true,
                device: 'Android',
                wifi
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
