"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.volumeTool = void 0;
const node_child_process_1 = require("node:child_process");
const node_util_1 = require("node:util");
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
exports.volumeTool = {
    name: 'get_volume_status',
    description: 'Get the current Android audio stream volume levels using Termux:API. Read-only device information.',
    permission: 'read_only',
    parameters: {
        type: 'object',
        properties: {},
        required: []
    },
    async execute() {
        try {
            const { stdout } = await execFileAsync('termux-volume', [], { timeout: 10000 });
            const volumes = JSON.parse(stdout);
            return {
                success: true,
                device: 'Android',
                volumes
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
