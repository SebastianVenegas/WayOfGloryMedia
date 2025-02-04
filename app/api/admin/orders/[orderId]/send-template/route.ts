import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { getEmailTemplate, Order as EmailOrder } from '@/lib/email-templates';
import nodemailer from 'nodemailer';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

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
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { templateId, customEmail, isPWA = false } = await request.json();
    const orderId = parseInt(params.orderId);

    if (!orderId || isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    // Fetch order details
    const orderData = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        total_amount: true,
        installation_date: true,
        installation_time: true,
        installation_address: true,
        installation_city: true,
        installation_state: true,
        installation_zip: true,
        shipping_address: true,
        shipping_city: true,
        shipping_state: true,
        shipping_zip: true,
      },
    });

    if (!orderData) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Convert the order data to match the EmailOrder interface
    const order: EmailOrder = {
      ...orderData,
      total_amount: orderData.total_amount as unknown as Decimal,
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