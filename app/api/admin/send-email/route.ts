import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { sql } from '@vercel/postgres'

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
})

// Updated base style to match the clean design
const baseStyle = `
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
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
`

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

function formatEmailContent(content: string, order: Order, customerName: string) {
  // Replace common placeholders with actual values
  let formattedContent = content
    // Customer Information
    .replace(/\{customerName\}/g, customerName)
    .replace(/\[Customer's Name\]/g, customerName)
    .replace(/\[Customer Name\]/g, customerName)
    .replace(/\{firstName\}/g, order.first_name)
    .replace(/\{lastName\}/g, order.last_name)
    .replace(/\{email\}/g, order.email)
    .replace(/\{phone\}/g, order.phone || 'Not provided')
    .replace(/\{organization\}/g, order.organization || 'Not provided')

    // Order Information
    .replace(/\{orderId\}/g, order.id.toString())
    .replace(/\[12345ABC\]/g, `#${order.id}`)
    .replace(/\{orderDate\}/g, new Date(order.created_at).toLocaleDateString())
    .replace(/\{orderTime\}/g, new Date(order.created_at).toLocaleTimeString())
    .replace(/\{totalAmount\}/g, `$${Number(order.total_amount).toFixed(2)}`)
    .replace(/\{status\}/g, order.status)

    // Installation Information
    .replace(/\{installationDate\}/g, order.installation_date || 'To be scheduled')
    .replace(/\{installationTime\}/g, order.installation_time || 'To be scheduled')
    .replace(/\{installationAddress\}/g, order.installation_address || 'Not provided')
    .replace(/\{installationCity\}/g, order.installation_city || '')
    .replace(/\{installationState\}/g, order.installation_state || '')
    .replace(/\{installationZip\}/g, order.installation_zip || '')
    .replace(/\{installationInstructions\}/g, order.installation_instructions || 'No special instructions provided')

    // Contact Information
    .replace(/\{contactOnsite\}/g, order.contact_onsite || 'Not provided')
    .replace(/\{contactOnsitePhone\}/g, order.contact_onsite_phone || 'Not provided')

    // Shipping Information
    .replace(/\{shippingAddress\}/g, order.shipping_address || 'Same as installation address')
    .replace(/\{shippingCity\}/g, order.shipping_city || '')
    .replace(/\{shippingState\}/g, order.shipping_state || '')
    .replace(/\{shippingZip\}/g, order.shipping_zip || '')
    .replace(/\{shippingInstructions\}/g, order.shipping_instructions || 'No special instructions provided')

    // Payment Information
    .replace(/\{paymentMethod\}/g, order.payment_method || 'Not specified')

    // Company Information
    .replace(/\{companyPhone\}/g, '(310) 872-9781')
    .replace(/\{companyEmail\}/g, 'help@wayofglory.com')
    .replace(/\{companyWebsite\}/g, 'www.wayofglory.com')

    // Handle signature placeholders
    .replace(/\[Your Name\]/g, 'Customer Care Team')
    .replace(/\[Name\]/g, 'Customer Care Team')

  // Format order items if they exist
  if (order.order_items && order.order_items.length > 0) {
    const itemsList = order.order_items.map((item: OrderItem) => 
      `${item.product?.title || 'Product'} (Qty: ${item.quantity}) - $${Number(item.price_at_time).toFixed(2)}`
    ).join('<br>')
    formattedContent = formattedContent.replace(/\{orderItems\}/g, itemsList)
  }

  // Add line breaks for better formatting
  formattedContent = formattedContent
    .split('\n')
    .map(line => line.trim()) // Trim whitespace
    .filter(line => line) // Remove empty lines
    .map(line => `<p>${line}</p>`)
    .join('')

  return formattedContent
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
`
}

export async function POST(request: Request) {
  try {
    const { 
      orderId, 
      email, 
      subject, 
      content, 
      customerName,
      order 
    } = await request.json()

    if (!email || !subject || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Ensure we have a valid customer name
    const validCustomerName = customerName || `${order.first_name} ${order.last_name}`.trim()

    const formattedContent = formatEmailContent(content, order, validCustomerName)

    // Format the email content with improved HTML structure
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${baseStyle}
        </head>
        <body>
          <div class="email-container">
            <div class="content">
              ${formattedContent}
              
              <div class="order-details">
                <h3>Order Details</h3>
                <div class="order-detail-row">
                  <span class="order-detail-label">Order Number</span>
                  <span class="order-detail-value">#${order.id}</span>
                </div>
                <div class="order-detail-row">
                  <span class="order-detail-label">Order Date</span>
                  <span class="order-detail-value">${new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div class="order-detail-row">
                  <span class="order-detail-label">Total Amount</span>
                  <span class="order-detail-value">$${Number(order.total_amount).toFixed(2)}</span>
                </div>
                ${order.installation_date ? `
                <div class="order-detail-row">
                  <span class="order-detail-label">Installation Date</span>
                  <span class="order-detail-value">${order.installation_date} ${order.installation_time || ''}</span>
                </div>
                ` : ''}
              </div>
            </div>
            
            <div class="footer">
              <p class="company-name">Way of Glory</p>
              <p class="contact-info">
                123 ABC Street, City, State, ZIP<br>
                Phone: <a href="tel:+13108729781">(310) 872-9781</a><br>
                Email: <a href="mailto:help@wayofglory.com">help@wayofglory.com</a><br>
                Website: <a href="https://www.wayofglory.com">www.wayofglory.com</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    // Send the email with proper formatting
    await transporter.sendMail({
      from: {
        name: 'Way of Glory',
        address: process.env.GMAIL_USER || 'help@wayofglory.com'
      },
      to: {
        name: validCustomerName,
        address: email
      },
      subject: subject,
      html: htmlContent,
      text: content // Fallback plain text version
    })

    // Log the email in the database
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
    `

    return NextResponse.json({ 
      success: true,
      message: 'Email sent successfully'
    })

  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 