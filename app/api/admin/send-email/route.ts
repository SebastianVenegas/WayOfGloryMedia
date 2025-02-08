import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { sql } from '@vercel/postgres';

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Updated base style to match the clean design
const baseStyle = `
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial,
        sans-serif;
      line-height: 1.6;
      color: #374151;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .content {
      font-size: 16px;
      line-height: 1.6;
      color: #374151;
      margin-bottom: 32px;
    }
    .content p {
      margin: 0 0 16px 0;
      padding: 0;
    }
    .order-details {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      margin: 24px 0;
    }
    .order-details h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      color: #111827;
    }
    .order-detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .order-detail-row:last-child {
      border-bottom: none;
    }
    .order-detail-label {
      color: #6b7280;
      font-size: 14px;
    }
    .order-detail-value {
      color: #111827;
      font-size: 14px;
      font-weight: 500;
    }
    a {
      color: #2563eb;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
    }
    .footer p {
      margin: 4px 0;
      font-size: 14px;
      line-height: 1.5;
    }
    .company-name {
      font-size: 16px;
      color: #111827;
      margin-bottom: 8px;
    }
    .contact-info {
      font-size: 14px;
      color: #6b7280;
    }
    .contact-info a {
      color: #2563eb;
    }
  </style>
`;

// Add TypeScript interfaces
interface OrderItem {
  quantity: number;
  price_at_time: number;
  product?: {
    title?: string;
  };
}

interface Order {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  organization?: string;
  created_at: string;
  total_amount: number;
  status: string;
  installation_date?: string;
  installation_time?: string;
  installation_address?: string;
  installation_city?: string;
  installation_state?: string;
  installation_zip?: string;
  installation_instructions?: string;
  contact_onsite?: string;
  contact_onsite_phone?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;
  shipping_instructions?: string;
  payment_method?: string;
  order_items?: OrderItem[];
}

// Helper function to format a number as currency
const formatCurrency = (amount: number): string => {
  return `$${Number(amount).toFixed(2)}`;
};

// Helper function to format a date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

// Function to generate HTML for order items
const generateOrderItemsHTML = (orderItems: OrderItem[]): string => {
  return orderItems
    .map(
      (item) => `
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
            <div style="font-size: 16px; font-weight: 500; color: #111827;">
              ${item.product?.title || 'Product'}
            </div>
            <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">
              Quantity: ${item.quantity}
            </div>
          </td>
        </tr>
      `
    )
    .join('');
};

function formatEmailContent(content: string, order: any, customerName: string) {
  // Replace variables in content
  let processedContent = content
    .replace(/\{customerName\}/g, customerName)
    .replace(/\{orderId\}/g, String(order.id))
    .replace(/\{orderDate\}/g, formatDate(order.created_at))
    .replace(/\{totalAmount\}/g, formatCurrency(order.total_amount))
    .replace(/\{firstName\}/g, order.first_name)
    .replace(/\{lastName\}/g, order.last_name)
    .replace(/\{email\}/g, order.email)
    .replace(/\{phone\}/g, order.phone || 'Not provided')
    .replace(/\{organization\}/g, order.organization || 'Not provided')
    .replace(/\{status\}/g, order.status)
    .replace(/\{installationDate\}/g, order.installation_date || 'To be scheduled')
    .replace(/\{installationTime\}/g, order.installation_time || 'To be scheduled')
    .replace(/\{installationAddress\}/g, order.installation_address || 'Not provided')
    .replace(/\{installationCity\}/g, order.installation_city || '')
    .replace(/\{installationState\}/g, order.installation_state || '')
    .replace(/\{installationZip\}/g, order.installation_zip || '')
    .replace(/\{installationInstructions\}/g, order.installation_instructions || 'No special instructions provided')
    .replace(/\{contactOnsite\}/g, order.contact_onsite || 'Not provided')
    .replace(/\{contactOnsitePhone\}/g, order.contact_onsite_phone || 'Not provided')
    .replace(/\{shippingAddress\}/g, order.shipping_address || 'Same as installation address')
    .replace(/\{shippingCity\}/g, order.shipping_city || '')
    .replace(/\{shippingState\}/g, order.shipping_state || '')
    .replace(/\{shippingZip\}/g, order.shipping_zip || '')
    .replace(/\{shippingInstructions\}/g, order.shipping_instructions || 'No special instructions provided')
    .replace(/\{paymentMethod\}/g, order.payment_method || 'Not specified')
    .replace(/\{companyPhone\}/g, '(310) 872-9781')
    .replace(/\{companyEmail\}/g, 'help@wayofglory.com')
    .replace(/\{companyWebsite\}/g, 'www.wayofglory.com')
    .replace(/\[Your Name\]/g, 'Customer Care Team')
    .replace(/\[Name\]/g, 'Customer Care Team');

  // Format order items if they exist
  if (order.order_items && order.order_items.length > 0) {
    const itemsList = generateOrderItemsHTML(order.order_items);
    processedContent = processedContent.replace(/\{orderItems\}/g, itemsList);
  }

  // Ensure proper line breaks
  processedContent = processedContent.replace(/\n/g, '<br>').replace(/\r/g, '').trim();

  return processedContent;
}

// Add a helper function to show available variables
function getAvailableVariables() {
  return `
Available Variables for Email Templates:

Customer Information:
{customerName} - Full name
{firstName} - First name
{lastName} - Last name
{email} - Email address
{phone} - Phone number
{organization} - Organization name

Order Information:
{orderId} - Order number
{orderDate} - Order date
{orderTime} - Order time
{totalAmount} - Total order amount
{status} - Order status
{orderItems} - List of ordered items

Installation Information:
{installationDate} - Installation date
{installationTime} - Installation time
{installationAddress} - Installation address
{installationCity} - Installation city
{installationState} - Installation state
{installationZip} - Installation ZIP code
{installationInstructions} - Special installation instructions

Contact Information:
{contactOnsite} - Onsite contact name
{contactOnsitePhone} - Onsite contact phone

Shipping Information:
{shippingAddress} - Shipping address
{shippingCity} - Shipping city
{shippingState} - Shipping state
{shippingZip} - Shipping ZIP code
{shippingInstructions} - Special shipping instructions

Payment Information:
{paymentMethod} - Payment method

Company Information:
{companyPhone} - Company phone number
{companyEmail} - Company email
{companyWebsite} - Company website
`;
}

// Function to generate the email HTML
const generateEmailHTML = (order: Order, formattedContent: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Installation Confirmation for Order #${order.id}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
        <tr>
          <td align="center" style="padding: 20px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(to right, #2563eb, #3b82f6); padding: 32px 24px; text-align: center;">
                  <img src="https://wayofglorymedia.com/images/logo/Logo.png" alt="Way of Glory Media" style="width: 200px; height: auto; margin-bottom: 16px; max-width: 100%;" />
                  <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600; line-height: 1.4;">Installation Confirmation for Order #${order.id}</h1>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 32px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <!-- Greeting -->
                    <tr>
                      <td style="padding-bottom: 24px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="font-size: 16px; line-height: 1.5; color: #111827;">
                              Dear ${order.first_name} ${order.last_name},
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Main Message -->
                    <tr>
                      <td style="padding-bottom: 24px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="font-size: 16px; line-height: 1.5; color: #111827;">
                              We are excited to inform you that your order #${order.id} is scheduled for installation${order.installation_date ? ` on ${order.installation_date}` : ''}. 
                              We are eager to provide you with the best audio and visual solutions to enhance your experience.
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Order Details -->
                    <tr>
                      <td style="padding-bottom: 32px;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                          <tr>
                            <td style="padding: 24px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="padding-bottom: 20px;">
                                    <h2 style="font-size: 20px; color: #111827; margin: 0; font-weight: 600;">Order Details</h2>
                                  </td>
                                </tr>
                                <tr>
                                  <td>
                                    <table width="100%" cellpadding="0" cellspacing="0" style="border-spacing: 0 12px;">
                                      <tr>
                                        <td width="50%" style="color: #6b7280; font-size: 16px;">Order Number:</td>
                                        <td width="50%" style="color: #111827; font-size: 16px; font-weight: 500; text-align: right;">#${order.id}</td>
                                      </tr>
                                      <tr>
                                        <td width="50%" style="color: #6b7280; font-size: 16px;">Order Date:</td>
                                        <td width="50%" style="color: #111827; font-size: 16px; font-weight: 500; text-align: right;">${formatDate(order.created_at)}</td>
                                      </tr>
                                      <tr>
                                        <td width="50%" style="color: #6b7280; font-size: 16px;">Total Amount:</td>
                                        <td width="50%" style="color: #111827; font-size: 16px; font-weight: 500; text-align: right;">${formatCurrency(order.total_amount)}</td>
                                      </tr>
                                      ${order.installation_date ? `
                                      <tr>
                                        <td width="50%" style="color: #6b7280; font-size: 16px;">Installation Date:</td>
                                        <td width="50%" style="color: #111827; font-size: 16px; font-weight: 500; text-align: right;">${order.installation_date}</td>
                                      </tr>
                                      ` : ''}
                                      ${order.installation_time ? `
                                      <tr>
                                        <td width="50%" style="color: #6b7280; font-size: 16px;">Installation Time:</td>
                                        <td width="50%" style="color: #111827; font-size: 16px; font-weight: 500; text-align: right;">${order.installation_time}</td>
                                      </tr>
                                      ` : ''}
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Ordered Items -->
                    ${order.order_items && order.order_items.length > 0 ? `
                    <tr>
                      <td style="padding-bottom: 32px;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                          <tr>
                            <td style="padding: 24px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="padding-bottom: 16px;">
                                    <h2 style="font-size: 18px; color: #111827; margin: 0;">Ordered Items</h2>
                                  </td>
                                </tr>
                                ${generateOrderItemsHTML(order.order_items)}
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    ` : ''}

                    <!-- Contact Information -->
                    <tr>
                      <td>
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                          <tr>
                            <td style="padding: 24px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="padding-bottom: 16px;">
                                    <h2 style="font-size: 18px; color: #111827; margin: 0;">Contact Information</h2>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding-bottom: 16px; color: #111827;">
                                    If you have any questions before your installation, please contact us:
                                  </td>
                                </tr>
                                <tr>
                                  <td>
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                      <tr>
                                        <td style="padding-bottom: 8px;">
                                          Phone: <a href="tel:+13108729781" style="color: #2563eb; text-decoration: none;">(310) 872-9781</a>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td>
                                          Email: <a href="mailto:support@wayofglorymedia.com" style="color: #2563eb; text-decoration: none;">support@wayofglorymedia.com</a>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="border-top: 1px solid #e5e7eb; padding: 24px; text-align: center;">
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">
                    Way of Glory Media
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export async function POST(request: Request) {
  try {
    const { orderId, email, subject, content, customerName, order } =
      await request.json();

    if (!email || !subject || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const validCustomerName =
      customerName || `${order.first_name} ${order.last_name}`.trim();
    const formattedContent = formatEmailContent(content, order, validCustomerName);
    const html = generateEmailHTML(order, formattedContent);

    const mailOptions = {
      from: '"Way of Glory" <help@wayofglory.com>',
      to: email,
      subject: subject,
      html: html,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email via SMTP' },
        { status: 500 }
      );
    }

    try {
    await sql`
      INSERT INTO email_logs (
        order_id,
        subject,
        content,
        sent_at
      ) VALUES (
        ${orderId},
        ${subject},
        ${content},
        NOW()
      )
      `;
    } catch (dbError) {
      console.error('Error logging email:', dbError);
      // Don't return error here since email was sent successfully
    }

    return NextResponse.json({ 
      success: true,
      message: 'Email sent successfully',
    });
  } catch (error) {
    console.error('Error in email handler:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process email request',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 },
    );
  }
} 
