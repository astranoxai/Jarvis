"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatorTool = void 0;
exports.calculatorTool = {
    name: 'calculate',
    description: 'Calculate a basic arithmetic expression.',
    permission: 'read_only',
    parameters: {
        type: 'object',
        properties: {
            expression: {
                type: 'string',
                description: 'A basic arithmetic expression using numbers, +, -, *, /, %, parentheses, and decimals.'
            }
        },
        required: ['expression'],
        additionalProperties: false
    },
    async execute(args) {
        const expression = String(args.expression ?? '');
        if (!/^[0-9+\-*/%().\s]+$/.test(expression)) {
            throw new Error('Invalid arithmetic expression');
        }
        try {
            const result = Function(`"use strict"; return (${expression})`)();
            if (typeof result !== 'number' || !Number.isFinite(result)) {
                throw new Error('Invalid calculation');
            }
            return {
                expression,
                result
            };
        }
        catch {
            throw new Error('Could not calculate expression');
        }
    }
};
