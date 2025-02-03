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

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const orderId = url.pathname.split('/').slice(-2, -1)[0]; // Extract ID from URL

    // Get order details from database
    const { rows: [order] } = await sql.query(
      `SELECT 
        id, 
        first_name, 
        last_name, 
        email,
        total_amount,
        installation_date,
        installation_time,
        installation_address,
        installation_city,
        installation_state,
        installation_zip,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_zip
      FROM orders WHERE id = $1`,
      [orderId]
    );

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const { templateId, customEmail } = await request.json();

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
      emailContent = customEmail.html;
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

    // Send email
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

    // Log the email in the database
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