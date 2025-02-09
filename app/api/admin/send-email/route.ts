import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

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
    const { email, subject, emailContent } = body;

    // Validate required fields
    if (!email || !subject || !emailContent) {
      console.error('Missing required fields:', {
        hasEmail: !!email,
        hasSubject: !!subject,
        hasContent: !!emailContent
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

    // Send email with proper content type headers
    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: subject,
      html: emailContent,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8'
      }
    });

    console.log('Email sent successfully:', info);
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
