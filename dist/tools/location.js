"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationTool = void 0;
const node_child_process_1 = require("node:child_process");
const node_util_1 = require("node:util");
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
exports.locationTool = {
    name: 'get_location',
    description: 'Get the Android device current location using Termux:API. This is a read-only device location tool. Use it when the user asks where they are or requests their current device location.',
    permission: 'read_only',
    parameters: {
        type: 'object',
        properties: {},
        required: []
    },
    async execute() {
        try {
            const { stdout } = await execFileAsync('termux-location', [], { timeout: 20000 });
            const location = JSON.parse(stdout);
            return {
                success: true,
                device: 'Android',
                location
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
