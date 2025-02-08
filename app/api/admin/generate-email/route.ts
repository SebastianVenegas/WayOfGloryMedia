import { NextResponse } from 'next/server'
import { getEmailPrompt } from '@/lib/email-templates'
import prisma from '@/lib/prisma'
import OpenAI from 'openai'
import { sql } from '@vercel/postgres'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface Order {
  id: number;
  customer_name: string;
  email: string;
  status: string;
  total: number;
  created_at: string;
  notes?: string;
  phone?: string;
  payment_status?: string;
  payment_method?: string;
  first_name: string;
  last_name: string;
  total_amount?: number;
  installation_date?: string;
  installation_time?: string;
}

interface EmailResponse {
  subject: string;
  html: string;
  content: string;
  isNewTemplate: boolean;
}

// Function to process variables in content
function processVariables(content: string, order: any) {
  return content
    // Customer Information
    .replace(/\{customerName\}/g, order.customer_name || '')
    .replace(/\{email\}/g, order.email || '')
    .replace(/\{phone\}/g, order.phone || 'Not provided')

    // Order Information
    .replace(/\{orderId\}/g, order.id)
    .replace(/\#\{orderId\}/g, `#${order.id}`)
    .replace(/\{orderDate\}/g, new Date(order.created_at).toLocaleDateString())
    .replace(/\{totalAmount\}/g, `$${Number(order.total).toFixed(2)}`)
    .replace(/\{status\}/g, order.status)
    .replace(/\{notes\}/g, order.notes || 'No notes provided')
}

export async function POST(req: Request) {
  try {
    const { orderId, templateType, content, customPrompt, isPWA } = await req.json()

    // Fetch order details
    const result = await sql`
      SELECT o.*, 
        json_agg(json_build_object(
          'id', oi.id,
          'product_id', oi.product_id,
          'quantity', oi.quantity,
          'price_at_time', oi.price_at_time,
          'product', json_build_object(
            'title', p.title,
            'category', p.category
          )
        )) as order_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = ${orderId}
      GROUP BY o.id
    `

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const order = result.rows[0]

    // Process the content with variables if it's provided
    let processedContent = content
    if (content) {
      // Replace all template variables
      processedContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6;">
          <h1 style="font-size: 24px; color: #111827; margin-bottom: 24px;">Installation Confirmation for Order #${order.id}</h1>
          
          <p style="margin-bottom: 16px;">Dear ${order.first_name} ${order.last_name},</p>
          
          <p style="margin-bottom: 24px;">We are excited to inform you that your order #${order.id} is scheduled for installation on ${order.installation_date}. We are eager to provide you with the best audio and visual solutions to enhance your experience.</p>
          
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
            <h2 style="font-size: 18px; color: #111827; margin-bottom: 16px;">Order Details</h2>
            <p style="margin-bottom: 8px;"><strong>Order Number:</strong> #${order.id}</p>
            <p style="margin-bottom: 8px;"><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
            <p style="margin-bottom: 8px;"><strong>Total Amount:</strong> $${Number(order.total_amount || 0).toFixed(2)}</p>
            <p style="margin-bottom: 8px;"><strong>Installation Date:</strong> ${order.installation_date}</p>
            ${order.installation_time ? `<p style="margin-bottom: 8px;"><strong>Installation Time:</strong> ${order.installation_time}</p>` : ''}
          </div>

          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
            <h2 style="font-size: 18px; color: #111827; margin-bottom: 16px;">Ordered Items</h2>
            ${order.order_items.map((item: any) => `
              <div style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                <p style="margin: 0;"><strong>${item.product.title}</strong></p>
                <p style="margin: 4px 0 0 0; color: #6b7280;">Quantity: ${item.quantity}</p>
              </div>
            `).join('')}
          </div>

          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
            <h2 style="font-size: 18px; color: #111827; margin-bottom: 16px;">Preparation Instructions</h2>
            <ul style="margin: 0; padding-left: 24px;">
              <li style="margin-bottom: 8px;">Please ensure the installation area is clear and free from obstructions.</li>
              <li style="margin-bottom: 8px;">Ensure that all necessary power outlets are functioning and easily accessible.</li>
              <li style="margin-bottom: 8px;">If any furniture needs to be moved, please do so prior to our arrival.</li>
            </ul>
          </div>

          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
            <h2 style="font-size: 18px; color: #111827; margin-bottom: 16px;">What to Expect During Installation</h2>
            <p style="margin-bottom: 16px;">Our professional installation team will arrive promptly at the scheduled time. They will set up your new system, ensuring all aspects are working optimally and to your satisfaction. Expect the installation process to last between 2 to 4 hours, depending on the complexity of your system.</p>
          </div>

          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
            <h2 style="font-size: 18px; color: #111827; margin-bottom: 16px;">Contact Information</h2>
            <p style="margin-bottom: 8px;">If you have any questions or concerns leading up to your installation date, please don't hesitate to reach out to us:</p>
            <p style="margin-bottom: 4px;">• Phone: (310) 872-9781</p>
            <p style="margin-bottom: 4px;">• Email: support@wayofglorymedia.com</p>
          </div>

          <p style="margin-top: 32px;">Best Regards,</p>
          <p style="margin-bottom: 32px;">Way of Glory Media Installation Team</p>
        </div>
      `
    } else {
      // Generate email content using AI
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a professional email composer for Way of Glory Media, an audio and visual solutions company. Write emails that are clear, professional, and maintain the company's friendly yet professional tone. Include specific order details and make the email personal."
          },
          {
            role: "user",
            content: customPrompt || `Write a professional email for order #${order.id} that:
              - Addresses the customer by their full name: ${order.first_name} ${order.last_name}
              - References their order #${order.id} placed on ${new Date(order.created_at).toLocaleDateString()}
              - Mentions the total amount: $${Number(order.total_amount || 0).toFixed(2)}
              - Lists the ordered items:
                ${order.order_items.map((item: any) => 
                  `- ${item.product.title} (Quantity: ${item.quantity})`
                ).join('\n                ')}
              - Maintains a professional and friendly tone
              - Includes our contact information
              - Follows Way of Glory Media's brand voice`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })

      processedContent = completion.choices[0]?.message?.content || ''
    }

    // Format the email with proper styling
    const formattedEmail = await formatEmailPreview(processedContent, order)

    let subject = '';
    if (templateType === 'payment_reminder') {
      subject = `Payment Reminder for Order #${order.id}`;
    } else if (templateType === 'installation_confirmation') {
      subject = `Installation Confirmation for Order #${order.id}`;
    } else {
      subject = `Order #${order.id} Email`;
    }

    return NextResponse.json({ subject, content: formattedEmail, html: formattedEmail })
  } catch (error) {
    console.error('Error generating email:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate email' },
      { status: 500 }
    )
  }
}

async function formatEmailPreview(content: string, order: any): Promise<string> {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Email</title>
    <style type="text/css">
      @media (prefers-color-scheme: dark) {
        .logo-img {
          content: url('/images/logo/logo.png') !important;
        }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background-color:#f9fafb;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding:20px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
            <!-- Header with Logo -->
            <tr>
              <td style="background: linear-gradient(90deg, #2563eb, #3b82f6); padding: 20px; text-align: center; color: #ffffff; font-family: Arial, sans-serif;">
                <img class="logo-img" src="/images/logo/logoLight.png" alt="Way of Glory Logo" style="max-width: 100px; display: block; margin: 0 auto 10px auto;" />
                <h1 style="margin:0; font-size:24px;">Order Confirmation</h1>
              </td>
            </tr>
            <!-- Main Content -->
            <tr>
              <td style="padding:20px; font-family: Arial, sans-serif; color: #374151; font-size: 16px; line-height: 1.6;">
                ${content}
              </td>
            </tr>
            <!-- Order Details -->
            <tr>
              <td style="padding:20px; font-family: Arial, sans-serif; color: #374151; font-size: 14px;">
                <table role="presentation" cellpadding="10" cellspacing="0" width="100%" style="border: 1px solid #e2e8f0; border-collapse: collapse;">
                  <tr>
                    <td style="border: 1px solid #e2e8f0; font-weight: bold; background-color: #f1f5f9;">Order ID</td>
                    <td style="border: 1px solid #e2e8f0;">#${order?.id || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #e2e8f0; font-weight: bold; background-color: #f1f5f9;">Order Date</td>
                    <td style="border: 1px solid #e2e8f0;">${new Date(order?.created_at).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #e2e8f0; font-weight: bold; background-color: #f1f5f9;">Customer</td>
                    <td style="border: 1px solid #e2e8f0;">${order?.first_name || ''} ${order?.last_name || ''}</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #e2e8f0; font-weight: bold; background-color: #f1f5f9;">Total Amount</td>
                    <td style="border: 1px solid #e2e8f0;">$${Number(order?.total_amount || 0).toFixed(2)}</td>
                  </tr>
                  ${order?.installation_date ? `<tr>
                    <td style="border: 1px solid #e2e8f0; font-weight: bold; background-color: #f1f5f9;">Installation Date</td>
                    <td style="border: 1px solid #e2e8f0;">${order.installation_date}</td>
                  </tr>` : ''}
                  ${order?.installation_time ? `<tr>
                    <td style="border: 1px solid #e2e8f0; font-weight: bold; background-color: #f1f5f9;">Installation Time</td>
                    <td style="border: 1px solid #e2e8f0;">${order.installation_time}</td>
                  </tr>` : ''}
                </table>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background-color:#f8fafc; padding:20px; text-align:center; font-family: Arial, sans-serif; font-size:12px; color:#6b7280;">
                &copy; ${new Date().getFullYear()} Way of Glory Media. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
} 