import nodemailer from 'nodemailer';

let transporter = null;

/** Transporteur Nodemailer — null si le SMTP n'est pas configuré (.env). */
export function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: +(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_SECURE || 'true') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

export const mailFrom = () => process.env.MAIL_FROM || process.env.SMTP_USER || 'CotiScola <no-reply@example.mg>';
