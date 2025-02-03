import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { getEmailTemplate } from '@/lib/email-templates';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

const wrapEmailContent = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Way of Glory Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f4f5; padding: 20px;">
    <tr>
      <td align="center">
        ${content}
        <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p style="margin: 4px 0;">© ${new Date().getFullYear()} Way of Glory. All rights reserved.</p>
          <p style="margin: 4px 0;">123 ABC Street, City, State, ZIP</p>
          <p style="margin: 4px 0;">
            <a href="tel:+13108729781" style="color: #2563eb; text-decoration: none;">(310) 872-9781</a> |
            <a href="mailto:help@wayofglory.com" style="color: #2563eb; text-decoration: none;">help@wayofglory.com</a>
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const orderId = url.pathname.split('/').slice(-2, -1)[0];

    const { rows: [order] } = await sql.query(
      `SELECT * FROM orders WHERE id = $1`,
      [orderId]
    );

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { templateId, customEmail } = body;

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
      subject = customEmail.subject;
      emailContent = wrapEmailContent(customEmail.html);
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
        sent_at
      ) VALUES ($1, $2, $3, $4, NOW())`,
      [orderId, templateId, subject, emailContent]
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