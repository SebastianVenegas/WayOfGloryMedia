import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { getEmailTemplate, Order as EmailOrder } from '@/lib/email-templates';
import nodemailer from 'nodemailer';

// Check for required environment variables
if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  throw new Error('Missing required email configuration environment variables');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Verify email configuration on startup
transporter.verify(function(error, success) {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

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

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
): Promise<NextResponse> {
  try {
    const { templateId, customEmail, isPWA = false } = await request.json();
    const orderId = parseInt(params.orderId);

    if (!orderId || isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    // Fetch order details using Vercel Postgres
    const { rows } = await sql`
      SELECT 
        id,
        first_name,
        last_name,
        email,
        CAST(total_amount AS FLOAT) as total_amount,
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
      FROM orders 
      WHERE id = ${orderId}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = rows[0];

    // Convert the order data to match the EmailOrder interface
    const order: EmailOrder = {
      id: orderData.id,
      first_name: orderData.first_name,
      last_name: orderData.last_name,
      email: orderData.email,
      total_amount: orderData.total_amount,
      installation_date: orderData.installation_date,
      installation_time: orderData.installation_time,
      installation_address: orderData.installation_address,
      installation_city: orderData.installation_city,
      installation_state: orderData.installation_state,
      installation_zip: orderData.installation_zip,
      shipping_address: orderData.shipping_address,
      shipping_city: orderData.shipping_city,
      shipping_state: orderData.shipping_state,
      shipping_zip: orderData.shipping_zip,
    };

    // Get email template
    const template = getEmailTemplate(templateId, order, customEmail, isPWA);

    if (!template) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }

    // TODO: Send email using your email service
    // For now, just return the template
    return NextResponse.json(template);
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
} 