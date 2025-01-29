import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { Resend } from 'resend';

interface Order {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  total_amount: number | string;
  installation_date?: string;
}

interface CustomEmail {
  subject: string;
  content: string;
}

interface SendTemplateRequest {
  templateId: string;
  customEmail?: CustomEmail;
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates
const getEmailTemplate = (templateId: string, order: any, customEmail?: { subject: string; body: string }) => {
  // Base email styling
  const baseStyle = `
    <style>
      .email-container {
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff;
      }
      .header {
        background-color: #1a365d;
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 8px 8px 0 0;
      }
      .content {
        padding: 20px;
        line-height: 1.6;
        color: #333;
        border: 1px solid #e2e8f0;
        border-radius: 0 0 8px 8px;
      }
      .footer {
        text-align: center;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #e2e8f0;
        color: #666;
      }
      .button {
        display: inline-block;
        padding: 10px 20px;
        background-color: #1a365d;
        color: white;
        text-decoration: none;
        border-radius: 5px;
        margin: 10px 0;
      }
    </style>
  `;

  // If it's a custom email
  if (customEmail && templateId === 'custom') {
    return {
      subject: customEmail.subject,
      html: `
        ${baseStyle}
        <div class="email-container">
          <div class="header">
            <h1>Way of Glory</h1>
          </div>
          <div class="content">
            ${customEmail.body}
          </div>
          <div class="footer">
            <p>Thank you for choosing Way of Glory</p>
            <p>Order #${order.id}</p>
          </div>
        </div>
      `
    };
  }

  const templates: { [key: string]: { subject: string; html: string } } = {
    payment_reminder: {
      subject: 'Payment Reminder for Your Way of Glory Order',
      html: `
        ${baseStyle}
        <div class="email-container">
          <div class="header">
            <h1>Payment Reminder</h1>
          </div>
          <div class="content">
            <p>Dear ${order.first_name} ${order.last_name},</p>
            <p>This is a friendly reminder about your pending payment for order #${order.id}.</p>
            <p>Total amount due: <strong>$${order.total_amount}</strong></p>
            <p>Please complete your payment to proceed with your order.</p>
            <a href="#" class="button">Complete Payment</a>
          </div>
          <div class="footer">
            <p>Thank you for choosing Way of Glory</p>
          </div>
        </div>
      `
    },
    installation_confirmation: {
      subject: 'Installation Details for Your Way of Glory Order',
      html: `
        ${baseStyle}
        <div class="email-container">
          <div class="header">
            <h1>Installation Confirmation</h1>
          </div>
          <div class="content">
            <p>Dear ${order.first_name} ${order.last_name},</p>
            <p>Your installation for order #${order.id} has been scheduled.</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="margin-top: 0;">Installation Details</h3>
              <p><strong>Address:</strong> ${order.installation_address}, ${order.installation_city}, ${order.installation_state} ${order.installation_zip}</p>
              <p><strong>Date:</strong> ${order.installation_date}</p>
              <p><strong>Time:</strong> ${order.installation_time}</p>
            </div>
          </div>
          <div class="footer">
            <p>Thank you for choosing Way of Glory</p>
          </div>
        </div>
      `
    },
    shipping_update: {
      subject: 'Shipping Update for Your Way of Glory Order',
      html: `
        ${baseStyle}
        <div class="email-container">
          <div class="header">
            <h1>Shipping Update</h1>
          </div>
          <div class="content">
            <p>Dear ${order.first_name} ${order.last_name},</p>
            <p>Great news! Your order #${order.id} has been shipped!</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="margin-top: 0;">Shipping Details</h3>
              <p><strong>Address:</strong> ${order.shipping_address}, ${order.shipping_city}, ${order.shipping_state} ${order.shipping_zip}</p>
            </div>
            <a href="#" class="button">Track Your Order</a>
          </div>
          <div class="footer">
            <p>Thank you for choosing Way of Glory</p>
          </div>
        </div>
      `
    },
    thank_you: {
      subject: 'Thank You for Your Way of Glory Order',
      html: `
        ${baseStyle}
        <div class="email-container">
          <div class="header">
            <h1>Thank You for Your Order</h1>
          </div>
          <div class="content">
            <p>Dear ${order.first_name} ${order.last_name},</p>
            <p>Thank you for choosing Way of Glory. We truly appreciate your business!</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="margin-top: 0;">Order Summary</h3>
              <p><strong>Order Number:</strong> #${order.id}</p>
              <p><strong>Total Amount:</strong> $${order.total_amount}</p>
            </div>
            <p>We're excited to serve you and ensure your complete satisfaction.</p>
            <a href="#" class="button">View Order Details</a>
          </div>
          <div class="footer">
            <p>Thank you for choosing Way of Glory</p>
          </div>
        </div>
      `
    }
  };

  return templates[templateId];
};

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { templateId, customEmail } = await request.json() as SendTemplateRequest;
    const orderId = params.id;

    // Fetch order details
    const { rows } = await sql`
      SELECT 
        orders.*,
        json_agg(json_build_object(
          'id', order_items.id,
          'product_id', order_items.product_id,
          'quantity', order_items.quantity,
          'price_at_time', order_items.price_at_time,
          'cost_at_time', order_items.cost_at_time,
          'product', json_build_object(
            'title', products.title
          )
        )) as order_items
      FROM orders
      LEFT JOIN order_items ON orders.id = order_items.order_id
      LEFT JOIN products ON order_items.product_id = products.id
      WHERE orders.id = ${orderId}
      GROUP BY orders.id
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = rows[0];

    // Get email template
    const template = getEmailTemplate(templateId, order, customEmail);

    if (!template) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    // Ensure we have a valid RESEND_API_KEY
    if (!process.env.RESEND_API_KEY) {
      throw new Error('Missing RESEND_API_KEY');
    }

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: 'Way of Glory <orders@wayofglory.com>',
      to: order.email,
      subject: templateId === 'custom' ? customEmail.subject : template.subject,
      html: templateId === 'custom' ? customEmail.content : template.html,
      text: templateId === 'custom' ? customEmail.content.replace(/<[^>]*>/g, '') : template.html.replace(/<[^>]*>/g, ''),
    });

    if (!emailResponse.data?.id) {
      console.error('Resend API Error:', emailResponse);
      throw new Error('Failed to send email via Resend');
    }

    // Update order status
    await sql`
      UPDATE orders 
      SET updated_at = NOW()
      WHERE id = ${orderId}
    `;

    return NextResponse.json({ 
      success: true,
      message: 'Email sent successfully',
      emailId: emailResponse.data.id
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
} 