import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { ToolDefinition } from './types.js';

const imapHost = process.env.IMAP_HOST || 'imap.gmail.com';
const imapPort = Number(process.env.IMAP_PORT || 993);
const imapSecure = process.env.IMAP_SECURE !== 'false';
const imapUser = process.env.SMTP_USER;
const imapPass = process.env.SMTP_PASS;

export const readEmailsTool: ToolDefinition = {
  name: 'read_emails',
  description:
    'Read recent emails from the Gmail inbox. This tool is read-only and cannot send, delete, move, or modify emails.',
  permission: 'read_only',

  parameters: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of emails to return. Default 10, maximum 20.'
      },
      unread_only: {
        type: 'boolean',
        description: 'Return only unread emails.'
      }
    },
    required: []
  },

  async execute(args) {
    const requestedLimit =
      typeof args.limit === 'number' ? Math.floor(args.limit) : 10;

    const limit = Math.max(1, Math.min(requestedLimit, 20));
    const unreadOnly = args.unread_only === true;

    if (!imapUser || !imapPass) {
      return {
        success: false,
        error: 'Gmail IMAP credentials are not configured.'
      };
    }

    return new Promise((resolve) => {
      const imap = new Imap({
        user: imapUser,
        password: imapPass,
        host: imapHost,
        port: imapPort,
        tls: imapSecure,
        tlsOptions: {
          rejectUnauthorized: false
        }
      });

      let finished = false;

      const finish = (result: unknown) => {
        if (finished) return;
        finished = true;

        try {
          imap.end();
        } catch {}

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

          const criteria = unreadOnly ? ['UNSEEN'] : ['ALL'];

          imap.search(criteria, (searchErr, results) => {
            if (searchErr) {
              finish({
                success: false,
                error: searchErr.message
              });
              return;
            }

            if (!results || results.length === 0) {
              finish({
                success: true,
                count: 0,
                emails: []
              });
              return;
            }

            const selected = results.slice(-limit);
            const emails: unknown[] = [];
            let pending = selected.length;

            const done = () => {
              pending--;

              if (pending === 0) {
                finish({
                  success: true,
                  count: emails.length,
                  emails
                });
              }
            };

            for (const uid of selected) {
              const fetcher = imap.fetch(uid, {
                bodies: '',
                struct: true
              });

              let attributes: any = null;

              fetcher.on('message', (message) => {
                message.once('attributes', (attrs) => {
                  attributes = attrs;
                });

                message.on('body', (stream) => {
                  simpleParser(stream as any)
                    .then((mail) => {
                      const text =
                        mail.text?.replace(/\s+/g, ' ').trim() || '';

                      emails.push({
                        id: uid,
                        from: mail.from?.text || '',
                        to: mail.to && 'text' in mail.to
                          ? mail.to.text
                          : '',
                        subject: mail.subject || '(No subject)',
                        date: mail.date?.toISOString() || '',
                        preview:
                          text.length > 300
                            ? text.slice(0, 300) + '...'
                            : text,
                        unread:
                          Array.isArray(attributes?.flags)
                            ? !attributes.flags.includes('\\Seen')
                            : false
                      });

                      done();
                    })
                    .catch(() => done());
                });
              });

              fetcher.once('error', () => done());
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
