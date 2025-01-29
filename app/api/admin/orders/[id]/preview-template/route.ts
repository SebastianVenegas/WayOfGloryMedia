import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// Email templates
const getEmailTemplate = (templateId: string, order: any) => {
  const baseStyle = `
    <style>
      .email-container {
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 32px;
        background-color: #ffffff;
      }
      .header {
        text-align: center;
        margin-bottom: 32px;
      }
      .header img {
        height: 40px;
        margin-bottom: 24px;
      }
      .content {
        background-color: #ffffff;
        border-radius: 12px;
        padding: 32px;
        margin-bottom: 32px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .icon-header {
        display: flex;
        align-items: center;
        margin-bottom: 24px;
      }
      .icon-circle {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background-color: #f3f4f6;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
      }
      h1 {
        color: #111827;
        font-size: 24px;
        font-weight: 600;
        margin: 0;
      }
      p {
        color: #4b5563;
        font-size: 16px;
        line-height: 1.6;
        margin: 16px 0;
      }
      .details {
        background-color: #f9fafb;
        border-radius: 8px;
        padding: 16px;
        margin: 16px 0;
      }
      .button {
        display: inline-block;
        background-color: #2563eb;
        color: white;
        text-decoration: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-weight: 500;
        margin: 16px 0;
      }
      .footer {
        text-align: center;
        color: #6b7280;
        font-size: 14px;
        margin-top: 32px;
        padding-top: 32px;
        border-top: 1px solid #e5e7eb;
      }
    </style>
  `;

  const templates: { [key: string]: { subject: string; html: string } } = {
    payment_reminder: {
      subject: 'Payment Reminder for Your Santi Sounds Order',
      html: `
        ${baseStyle}
        <div class="email-container">
          <div class="content">
            <div class="icon-header">
              <div class="icon-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
              </div>
              <h1>Payment Reminder</h1>
            </div>
            <p>Dear ${order.first_name} ${order.last_name},</p>
            <p>This is a friendly reminder about your pending payment for order #${order.id}.</p>
            <div class="details">
              <p style="margin: 0;"><strong>Total Amount Due:</strong> $${order.total_amount}</p>
            </div>
            <p>Please complete your payment to proceed with your order. If you've already made the payment, please disregard this reminder.</p>
            <a href="#" class="button">Complete Payment</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Santi Sounds. All rights reserved.</p>
          </div>
        </div>
      `
    },
    installation_confirmation: {
      subject: 'Installation Details for Your Santi Sounds Order',
      html: `
        ${baseStyle}
        <div class="email-container">
          <div class="content">
            <div class="icon-header">
              <div class="icon-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
              </div>
              <h1>Installation Confirmation</h1>
            </div>
            <p>Dear ${order.first_name} ${order.last_name},</p>
            <p>Your installation for order #${order.id} has been scheduled. Here are the details:</p>
            <div class="details">
              <p style="margin: 0 0 8px 0;"><strong>Installation Address:</strong><br>
                ${order.installation_address}, ${order.installation_city}, ${order.installation_state} ${order.installation_zip}
              </p>
              <p style="margin: 0 0 8px 0;"><strong>Date & Time:</strong><br>
                ${order.installation_date} at ${order.installation_time}
              </p>
            </div>
            <p>Our installation team will arrive within the scheduled time window. Please ensure someone is available to provide access to the installation area.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Santi Sounds. All rights reserved.</p>
          </div>
        </div>
      `
    },
    shipping_update: {
      subject: 'Shipping Update for Your Santi Sounds Order',
      html: `
        ${baseStyle}
        <div class="email-container">
          <div class="content">
            <div class="icon-header">
              <div class="icon-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
              </div>
              <h1>Shipping Update</h1>
            </div>
            <p>Dear ${order.first_name} ${order.last_name},</p>
            <p>Great news! Your order #${order.id} has been shipped and is on its way to you.</p>
            <div class="details">
              <p style="margin: 0;"><strong>Delivery Address:</strong><br>
                ${order.shipping_address}, ${order.shipping_city}, ${order.shipping_state} ${order.shipping_zip}
              </p>
            </div>
            <p>We'll notify you once your order has been delivered. If you have any special delivery instructions, please contact us.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Santi Sounds. All rights reserved.</p>
          </div>
        </div>
      `
    },
    thank_you: {
      subject: 'Thank You for Your Santi Sounds Order',
      html: `
        ${baseStyle}
        <div class="email-container">
          <div class="content">
            <div class="icon-header">
              <div class="icon-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h1>Thank You!</h1>
            </div>
            <p>Dear ${order.first_name} ${order.last_name},</p>
            <p>Thank you for choosing Santi Sounds. We truly appreciate your business and trust in our services.</p>
            <div class="details">
              <p style="margin: 0 0 8px 0;"><strong>Order Number:</strong> #${order.id}</p>
              <p style="margin: 0;"><strong>Total Amount:</strong> $${order.total_amount}</p>
            </div>
            <p>We hope you're completely satisfied with your purchase. If you have any questions or need assistance, please don't hesitate to reach out.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Santi Sounds. All rights reserved.</p>
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
    const orderId = Number(params.id);
    const { templateId } = await request.json();

    // Get the order details from the database
    const { rows: [order] } = await sql`
      SELECT * FROM orders WHERE id = ${orderId}
    `;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get email template
    const template = getEmailTemplate(templateId, order);

    if (!template) {
      return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
    }

    return NextResponse.json({
      subject: template.subject,
      html: template.html
    });
  } catch (error) {
    console.error('Error generating template preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate template preview' },
      { status: 500 }
    );
  }
} 