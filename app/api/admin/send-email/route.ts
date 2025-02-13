import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    console.log('Starting email send process...');

    // Check for required email configuration
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('Missing email configuration:', {
        hasUser: !!process.env.GMAIL_USER,
        hasPassword: !!process.env.GMAIL_APP_PASSWORD
      });
      return NextResponse.json(
        { error: 'Email configuration is missing' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { email, subject, html, text } = body;

    // Validate required fields
    if (!email || !subject || !html) {
      console.error('Missing required fields:', {
        hasEmail: !!email,
        hasSubject: !!subject,
        hasHtml: !!html
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create transporter with specific configuration for HTML emails
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      },
      tls: {
        rejectUnauthorized: true
      }
    });

    // Verify transporter
    await transporter.verify();

    // Read the logo files
    const publicPath = path.join(process.cwd(), 'public');
    const logoLightPath = path.join(publicPath, 'images', 'logo', 'LogoLight.png');
    const logoNormalPath = path.join(publicPath, 'images', 'logo', 'logo.png');

    const logoLight = await fs.readFile(logoLightPath);
    const logoNormal = await fs.readFile(logoNormalPath);

    // Log email content for debugging
    console.log('Sending email with:', {
      to: email,
      subject: subject,
      htmlLength: html?.length || 0,
      textLength: text?.length || 0
    });

    // Replace image URLs with CID references
    const modifiedHtml = html
      .replace(/src="[^"]*LogoLight\.png"/g, 'src="cid:logoLight"')
      .replace(/src="[^"]*logo\.png"/g, 'src="cid:logoNormal"');

    // Send email with proper HTML configuration and embedded images
    const info = await transporter.sendMail({
      from: {
        name: 'Way of Glory Media',
        address: process.env.GMAIL_USER
      },
      to: email,
      subject: subject,
      text: text || '',
      html: modifiedHtml,
      messageId: `<${Date.now()}@wayofglory.com>`,
      attachments: [
        {
          filename: 'LogoLight.png',
          content: logoLight,
          cid: 'logoLight'
        },
        {
          filename: 'logo.png',
          content: logoNormal,
          cid: 'logoNormal'
        }
      ]
    });

    console.log('Email sent successfully:', {
      messageId: info.messageId,
      response: info.response
    });

    return NextResponse.json({ 
      success: true,
      messageId: info.messageId 
    });
  } catch (error) {
    console.error('Detailed error in send-email:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
