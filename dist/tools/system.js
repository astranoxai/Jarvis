"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemTool = void 0;
const node_os_1 = __importDefault(require("node:os"));
exports.systemTool = {
    name: 'get_system_info',
    description: 'Get basic information about the computer running JARVIS.',
    permission: 'read_only',
    parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
    },
    async execute() {
        return {
            hostname: node_os_1.default.hostname(),
            platform: node_os_1.default.platform(),
            architecture: node_os_1.default.arch(),
            cpu_count: node_os_1.default.cpus().length,
            total_memory_gb: Number((node_os_1.default.totalmem() / 1024 ** 3).toFixed(2)),
            free_memory_gb: Number((node_os_1.default.freemem() / 1024 ** 3).toFixed(2)),
            uptime_hours: Number((node_os_1.default.uptime() / 3600).toFixed(2))
        };
    }
};
