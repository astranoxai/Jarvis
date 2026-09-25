import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'node:path';

import { ToolDefinition } from './types.js';

/* =========================================
   LOAD NOVA ENVIRONMENT
========================================= */

const envPath =
  path.resolve(
    process.cwd(),
    '.env'
  );

dotenv.config({
  path: envPath
});

/* =========================================
   SMTP CONFIG
========================================= */

function getSmtpConfig() {
  return {
    host:
      process.env.SMTP_HOST ||
      'smtp.gmail.com',

    port:
      Number(
        process.env.SMTP_PORT ||
        465
      ),

    secure:
      process.env.SMTP_SECURE !==
      'false',

    user:
      process.env.SMTP_USER,

    pass:
      process.env.SMTP_PASS
  };
}

/* =========================================
   SEND EMAIL TOOL
========================================= */

export const sendEmailTool:
ToolDefinition = {
  name: 'send_email',

  description:
    'Send an email through the configured Gmail SMTP account. Use only when the user explicitly asks Nova to send an email.',

  permission: 'write_low_risk',

  parameters: {
    type: 'object',

    properties: {
      to: {
        type: 'string',
        description:
          'Recipient email address.'
      },

      subject: {
        type: 'string',
        description:
          'Email subject.'
      },

      body: {
        type: 'string',
        description:
          'Plain-text email body.'
      }
    },

    required: [
      'to',
      'subject',
      'body'
    ]
  },

  async execute(args) {
    const to =
      args.to;

    const subject =
      args.subject;

    const body =
      args.body;

    if (
      typeof to !== 'string' ||
      typeof subject !== 'string' ||
      typeof body !== 'string'
    ) {
      return {
        success: false,
        error:
          'to, subject, and body are required.'
      };
    }

    const smtp =
      getSmtpConfig();

    if (
      !smtp.user ||
      !smtp.pass
    ) {
      return {
        success: false,
        error:
          'Gmail SMTP is not configured.'
      };
    }

    try {
      const transporter =
        nodemailer.createTransport({
          host: smtp.host,
          port: smtp.port,
          secure: smtp.secure,

          auth: {
            user: smtp.user,
            pass: smtp.pass
          }
        });

      await transporter.verify();

      await transporter.sendMail({
        from: smtp.user,
        to,
        subject,
        text: body
      });

      return {
        success: true,
        from: smtp.user,
        to,
        subject
      };

    } catch (error) {
      return {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : String(error)
      };
    }
  }
};