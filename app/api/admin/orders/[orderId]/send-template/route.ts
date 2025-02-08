import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { getEmailTemplate } from '@/lib/email-templates';
import nodemailer from 'nodemailer';

const createEmailHtml = (content: string) => {
  // Basic inline styles for email compatibility
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${content}
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
        <p style="margin: 5px 0;">© ${new Date().getFullYear()} Way of Glory</p>
        <p style="margin: 5px 0;">
          <a href="tel:+13108729781" style="color: #2563eb; text-decoration: none;">(310) 872-9781</a> |
          <a href="mailto:help@wayofglory.com" style="color: #2563eb; text-decoration: none;">help@wayofglory.com</a>
        </p>
      </div>
    </div>
  `;
};

export async function POST(request: NextRequest) {
  // Check for required email configuration environment variables
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('Missing required email configuration environment variables');
    return NextResponse.json({ error: 'Missing required email configuration environment variables' }, { status: 500 });
  }
  
  // Create transporter and verify configuration
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
  
  try {
    await transporter.verify();
    console.log('Email server is ready to send messages');
  } catch (verifyError) {
    console.error('Email transporter verification error:', verifyError);
    return NextResponse.json({ error: 'Email transporter verification error: ' + (verifyError instanceof Error ? verifyError.message : 'Unknown error') }, { status: 500 });
  }

  try {
    const url = new URL(request.url);
    const orderId = url.pathname.split('/').slice(-2, -1)[0];

    // Log the request URL and orderId for debugging
    console.log('Request URL:', url.toString());
    console.log('Order ID:', orderId);

    const { rows: [order] } = await sql.query(
      `SELECT * FROM orders WHERE id = $1`,
      [orderId]
    );

    if (!order) {
      console.log('Order not found:', orderId);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    let requestBody;
    try {
      const text = await request.text();
      console.log('Raw request body:', text);
      requestBody = JSON.parse(text);
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { templateId, customEmail, isPWA } = requestBody;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    let emailContent;
    let subject;

    if (templateId === 'custom' && customEmail) {
      if (!customEmail.subject || !customEmail.html) {
        return NextResponse.json(
          { error: 'Custom email requires both subject and HTML content' },
          { status: 400 }
        );
      }

      // Special handling for PWA requests
      if (isPWA) {
        // Additional sanitization for PWA content
        const sanitizedHtml = customEmail.html
          .trim()
          .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/[^\x20-\x7E\s]/g, ''); // Remove non-printable characters

        // Ensure the content is properly wrapped
        emailContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333;">
            ${sanitizedHtml}
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 14px; margin: 5px 0;">© ${new Date().getFullYear()} Way of Glory</p>
              <p style="color: #666; font-size: 14px; margin: 5px 0;">
                <a href="tel:+13108729781" style="color: #2563eb; text-decoration: none;">(310) 872-9781</a> |
                <a href="mailto:help@wayofglory.com" style="color: #2563eb; text-decoration: none;">help@wayofglory.com</a>
              </p>
            </div>
          </div>
        `.trim();
      } else {
        emailContent = createEmailHtml(customEmail.html);
      }
      
      subject = customEmail.subject;
    } else {
      const template = getEmailTemplate(templateId, order);
      if (!template) {
        return NextResponse.json(
          { error: 'Invalid template ID' },
          { status: 400 }
        );
      }
      subject = template.subject;
      emailContent = template.html;
    }

    // Log email details for debugging
    console.log('Sending email:', {
      to: order.email,
      subject: subject,
      contentLength: emailContent.length,
      isPWA: isPWA || false
    });

    try {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: order.email,
        subject: subject,
        html: emailContent,
      });
    } catch (emailError) {
      console.error('Nodemailer error:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email: ' + (emailError instanceof Error ? emailError.message : 'Unknown error') },
        { status: 500 }
      );
    }

    await sql.query(
      `INSERT INTO email_logs (
        order_id,
        template_id,
        subject,
        content,
        sent_at,
        sent_from_pwa
      ) VALUES ($1, $2, $3, $4, NOW(), $5)`,
      [orderId, templateId, subject, emailContent, isPWA || false]
    );

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('Error in send-template:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
} 