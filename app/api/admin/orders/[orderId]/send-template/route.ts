import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { getEmailTemplate, formatEmailPreview } from '@/lib/email-templates';
import nodemailer from 'nodemailer';

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

    // Configure nodemailer with Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    let emailContent;
    let subject;

    if (templateId === 'custom') {
      // For custom emails
      subject = customEmail.subject;
      emailContent = await formatEmailPreview(customEmail.content, order);
    } else {
      // For predefined templates
      const template = getEmailTemplate(templateId, order);
      subject = template.subject;
      emailContent = template.html;
    }

    // Send email
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: order.email,
      subject: subject,
      html: emailContent,
    });

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
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 