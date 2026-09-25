"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmailTool = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpSecure = process.env.SMTP_SECURE !== 'false';
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
exports.sendEmailTool = {
    name: 'send_email',
    description: 'Send an email through the configured Gmail SMTP account. Use only when the user explicitly asks NOVA to send an email.',
    permission: 'write_low_risk',
    parameters: {
        type: 'object',
        properties: {
            to: {
                type: 'string',
                description: 'Recipient email address.'
            },
            subject: {
                type: 'string',
                description: 'Email subject.'
            },
            body: {
                type: 'string',
                description: 'Plain-text email body.'
            }
        },
        required: ['to', 'subject', 'body']
    },
    async execute(args) {
        const to = args.to;
        const subject = args.subject;
        const body = args.body;
        if (typeof to !== 'string' ||
            typeof subject !== 'string' ||
            typeof body !== 'string') {
            return {
                success: false,
                error: 'to, subject, and body are required.'
            };
        }
        if (!smtpUser || !smtpPass) {
            return {
                success: false,
                error: 'Gmail SMTP is not configured.'
            };
        }
        try {
            const transporter = nodemailer_1.default.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpSecure,
                auth: {
                    user: smtpUser,
                    pass: smtpPass
                }
            });
            await transporter.sendMail({
                from: smtpUser,
                to,
                subject,
                text: body
            });
            return {
                success: true,
                from: smtpUser,
                to,
                subject
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
};
