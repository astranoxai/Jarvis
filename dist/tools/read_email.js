"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readEmailTool = void 0;
const imap_1 = __importDefault(require("imap"));
const mailparser_1 = require("mailparser");
const imapHost = process.env.IMAP_HOST || 'imap.gmail.com';
const imapPort = Number(process.env.IMAP_PORT || 993);
const imapSecure = process.env.IMAP_SECURE !== 'false';
const imapUser = process.env.SMTP_USER;
const imapPass = process.env.SMTP_PASS;
exports.readEmailTool = {
    name: 'read_email',
    description: 'Read the full contents of a specific Gmail email using its email ID returned by read_emails. This tool is strictly read-only.',
    permission: 'read_only',
    parameters: {
        type: 'object',
        properties: {
            id: {
                type: 'number',
                description: 'The email ID/UID returned by the read_emails tool.'
            }
        },
        required: ['id']
    },
    async execute(args) {
        const id = Number(args.id);
        if (!Number.isInteger(id) || id <= 0) {
            return {
                success: false,
                error: 'A valid email ID is required.'
            };
        }
        if (!imapUser || !imapPass) {
            return {
                success: false,
                error: 'Gmail IMAP credentials are not configured.'
            };
        }
        return new Promise((resolve) => {
            const imap = new imap_1.default({
                user: imapUser,
                password: imapPass,
                host: imapHost,
                port: imapPort,
                tls: imapSecure,
                // Currently matching the working read_emails configuration.
                tlsOptions: {
                    rejectUnauthorized: false
                }
            });
            let finished = false;
            const finish = (result) => {
                if (finished)
                    return;
                finished = true;
                try {
                    imap.end();
                }
                catch { }
                resolve(result);
            };
            imap.once('ready', () => {
                imap.openBox('INBOX', true, (err) => {
                    if (err) {
                        finish({
                            success: false,
                            error: err.message
                        });
                        return;
                    }
                    const fetcher = imap.fetch(id, {
                        bodies: '',
                        struct: true
                    });
                    let found = false;
                    let attributes = null;
                    fetcher.on('message', (message) => {
                        found = true;
                        message.once('attributes', (attrs) => {
                            attributes = attrs;
                        });
                        message.on('body', (stream) => {
                            (0, mailparser_1.simpleParser)(stream)
                                .then((mail) => {
                                const text = mail.text?.trim() || '';
                                const html = mail.html || null;
                                finish({
                                    success: true,
                                    email: {
                                        id,
                                        from: mail.from?.text || '',
                                        to: mail.to && 'text' in mail.to
                                            ? mail.to.text
                                            : '',
                                        cc: mail.cc && 'text' in mail.cc
                                            ? mail.cc.text
                                            : '',
                                        subject: mail.subject || '(No subject)',
                                        date: mail.date?.toISOString() || '',
                                        text,
                                        html,
                                        attachments: Array.isArray(mail.attachments)
                                            ? mail.attachments.map((attachment) => ({
                                                filename: attachment.filename || '',
                                                contentType: attachment.contentType || '',
                                                size: attachment.size || 0
                                            }))
                                            : [],
                                        unread: Array.isArray(attributes?.flags)
                                            ? !attributes.flags.includes('\\Seen')
                                            : false
                                    }
                                });
                            })
                                .catch((parseErr) => {
                                finish({
                                    success: false,
                                    error: parseErr?.message ||
                                        'Unable to parse email.'
                                });
                            });
                        });
                    });
                    fetcher.once('error', (fetchErr) => {
                        finish({
                            success: false,
                            error: fetchErr.message
                        });
                    });
                    fetcher.once('end', () => {
                        if (!found) {
                            finish({
                                success: false,
                                error: `Email with ID ${id} was not found in the inbox.`
                            });
                        }
                    });
                });
            });
            imap.once('error', (err) => {
                finish({
                    success: false,
                    error: err.message
                });
            });
            imap.connect();
        });
    }
};
