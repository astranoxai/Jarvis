"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeTool = void 0;
exports.timeTool = {
    name: 'get_current_time',
    description: 'Get the current date and time in India Standard Time (IST, Asia/Kolkata).',
    permission: 'read_only',
    parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
    },
    async execute() {
        const now = new Date();
        return {
            timezone: 'Asia/Kolkata',
            timezone_name: 'India Standard Time',
            time: now.toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                dateStyle: 'full',
                timeStyle: 'long'
            }),
            iso: now.toISOString()
        };
    }
};
