import nodemailer from 'nodemailer';
import { htmlToText } from 'html-to-text';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { IUser } from '../models/userModel.js';

const baseEmail = fs.readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    '../templates/emails/baseEmail.html'
  ),
  'utf-8'
);

const verifyEmail = fs.readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    '../templates/emails/verifyEmail.html'
  ),
  'utf-8'
);

const welcomeEmail = fs.readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    '../templates/emails/welcomeEmail.html'
  ),
  'utf-8'
);

const resetPassword = fs.readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    '../templates/emails/resetPassword.html'
  ),
  'utf-8'
);

class Email {
  private to: string;
  private username: string;
  private from =
    (process.env.NODE_ENV === 'production'
      ? process.env.SENDGRID_FROM
      : process.env.MAILTRAP_FROM) || '';

  constructor(user: IUser, private url: string) {
    this.to = user.email;
    this.username = user.username;
  }

  // Creates Transporter
  private createNewTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: parseInt(process.env.MAILTRAP_PORT as string),
      secure: false, // use SSL
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });
  }

  // Sends the mail
  private async send(template: string, subject: string) {
    // Render HTML
    const templateContent = template
      .replace('{{USERNAME}}', this.username)
      .replace('{{URL}}', this.url);

    const html = baseEmail
      .replace('{{SUBJECT}}', subject)
      .replace('{{CONTENT}}', templateContent);

    // Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };

    // create transport and send email
    await this.createNewTransport().sendMail(mailOptions);
  }

  // Sends verification email
  async sendEmailVerification() {
    await this.send(verifyEmail, 'Verify Your Email');
  }

  // Sends welcome email
  async sendWelcome() {
    await this.send(welcomeEmail, 'Welcome to the Buzzer Family');
  }

  // Sends pasword reset email
  async sendPasswordReset() {
    await this.send(resetPassword, 'Reset your Password');
  }
}

export default Email;
