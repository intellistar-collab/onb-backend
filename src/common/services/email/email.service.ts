import { Injectable } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { SubscriptionService } from 'src/subscription/subscription.service';

import Mailgun from 'mailgun.js';
import * as FormData from 'form-data';

@Injectable()
export class EmailService {
  constructor(
    private configService: ConfigService,
    private subscriptionService: SubscriptionService,
  ) {}

  async sendEmail(to: string, subject: string, text: string, html?: string) {
    const mg = new Mailgun(FormData);

    const client = mg.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY || 'ab50369f6e7c7b153d687363147c6ec1-10b6f382-1ba5bfc5',
    });

    try {
      const data = await client.messages.create(
        process.env.MAILGUN_DOMAIN || 'sandboxfecec8ca551f479f8439e80859fb0048.mailgun.org',
        {
          from:
            process.env.EMAIL_FROM ||
            'ONB Team <postmaster@sandboxfecec8ca551f479f8439e80859fb0048.mailgun.org>',
          to: ['aymansaghbini@gmail.com'],
          subject: subject,
          text: text,
          ...(html && { html }),
        },
      );

      console.log(data);
    } catch (error) {
      console.log(error);
    }
  }

  async sendEmailWhenSubscribe(subscription: any) {
    const mg = new Mailgun(FormData);

    const client = mg.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY || 'ab50369f6e7c7b153d687363147c6ec1-10b6f382-1ba5bfc5',
    });

    try {
      const data = await client.messages.create(
        process.env.MAILGUN_DOMAIN || 'sandboxfecec8ca551f479f8439e80859fb0048.mailgun.org',
        {
          from:
            process.env.EMAIL_FROM ||
            'ONB Team <postmaster@sandboxfecec8ca551f479f8439e80859fb0048.mailgun.org>',
          to: ['aymansaghbini@gmail.com'],
          subject: 'Email Confirmation',
          template: 'Email Confirmation',
          'h:X-Mailgun-Variables': JSON.stringify({
            test: 'https://www.google.com/',
            email: subscription?.email,
            url: process.env.FRONTEND_URL,
            verificationToken: subscription?.verificationToken,
            username: subscription?.username,
          }),
        },
      );

      console.log(data);
    } catch (error) {
      console.log(error);
    }
  }

  async sendWelcomeEmail(subscription: any) {
    const mg = new Mailgun(FormData);

    const client = mg.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY || 'ab50369f6e7c7b153d687363147c6ec1-10b6f382-1ba5bfc5',
    });

    try {
      const data = await client.messages.create(
        process.env.MAILGUN_DOMAIN || 'sandboxfecec8ca551f479f8439e80859fb0048.mailgun.org',
        {
          from:
            process.env.EMAIL_FROM ||
            'ONB Team <postmaster@sandboxfecec8ca551f479f8439e80859fb0048.mailgun.org>',
          to: ['aymansaghbini@gmail.com'],
          subject: 'Welcome Email',
          template: 'Welcome Email',
          'h:X-Mailgun-Variables': JSON.stringify({
            test: 'https://www.google.com/',
          }),
        },
      );

      console.log(data);
    } catch (error) {
      console.log(error);
    }
  }

  async sendEmailSuccessfulReferral(subscription: any) {
    const mg = new Mailgun(FormData);

    const client = mg.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY || 'ab50369f6e7c7b153d687363147c6ec1-10b6f382-1ba5bfc5',
    });

    try {
      const data = await client.messages.create(
        process.env.MAILGUN_DOMAIN || 'sandboxfecec8ca551f479f8439e80859fb0048.mailgun.org',
        {
          from:
            process.env.EMAIL_FROM ||
            'ONB Team <postmaster@sandboxfecec8ca551f479f8439e80859fb0048.mailgun.org>',
          to: ['aymansaghbini@gmail.com'],
          subject: 'Successful Referral',
          template: 'Successful Referral',
          'h:X-Mailgun-Variables': JSON.stringify({
            test: 'https://www.google.com/',
            email: subscription?.email,
            url: process.env.FRONTEND_URL,
            username: subscription?.username,
            points: subscription?.points,
          }),
        },
      );

      console.log(data);
    } catch (error) {
      console.log(error);
    }
  }

  async sendInviteEmail(subscription: any) {
    const mg = new Mailgun(FormData);

    const client = mg.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY || 'ab50369f6e7c7b153d687363147c6ec1-10b6f382-1ba5bfc5',
    });

    try {
      const data = await client.messages.create(
        process.env.MAILGUN_DOMAIN || 'sandboxfecec8ca551f479f8439e80859fb0048.mailgun.org',
        {
          from:
            process.env.EMAIL_FROM ||
            'ONB Team <postmaster@sandboxfecec8ca551f479f8439e80859fb0048.mailgun.org>',
          to: ['aymansaghbini@gmail.com'],
          subject: 'Invite your friends',
          template: 'Invite your friends',
          'h:X-Mailgun-Variables': JSON.stringify({
            test: 'https://www.google.com/',
            url: process.env.FRONTEND_URL,
            email: subscription?.email,
            text: `Hey ${subscription?.username}, thanks for verifying. Invite friends and earn rewards!`,
            user: subscription?.username,
          }),
        },
      );

      console.log(data);
    } catch (error) {
      console.log(error);
    }
  }

  async sendOTP(email: string, otp: string) {
    const message = `Your OTP for login is: ${otp}. It will expire in 5 minutes.`;
    await this.sendEmail(email, 'Your OTP Code', message);
  }

  // Add the sendPasswordResetEmail function
  async sendPasswordResetEmail(email: string, resetToken: string) {
    // Assuming resetToken is a URL-safe token for password reset
    const resetLink = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${resetToken}`;
    const message = `We received a request to reset your password. Click the link below to reset your password:\n\n${resetLink}\n\nIf you didn't request a password reset, please ignore this email.`;

    await this.sendEmail(email, 'Password Reset Request', message);
  }

  async sendBulkEmail(subject: string, message: string) {
    const subscribers = await this.subscriptionService.findAllUnpaginated();

    if (!subscribers.length) {
      return { message: 'No subscribers found' };
    }

    for (const subscriber of subscribers) {
      await this.sendEmail(subscriber.email, subject, '', message);
    }

    return {
      message: 'Emails sent to all subscribers',
      total: subscribers.length,
    };
  }

  async sendEmailsToSelected(emails: string[], subject: string, message: string) {
    if (!emails.length) {
      return { message: 'No emails provided' };
    }

    for (const email of emails) {
      await this.sendEmail(email, subject, '', message);
    }

    return {
      message: 'Emails sent to selected subscribers',
      total: emails.length,
    };
  }
}
