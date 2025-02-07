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
    const { orderId, content, customPrompt, isPWA } = await req.json()

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
      processedContent = content
        .replace('[Customer Name]', `${order.first_name} ${order.last_name}`)
        .replace('[Start with a warm greeting and clear purpose for the email]', 
          `Thank you for your recent order with Way of Glory Media. We're writing to confirm the details of your order #${order.id}.`)
        .replace('[Key Information:]', 
          `We're pleased to confirm your order details below:

• Order Number: #${order.id}
• Order Date: ${new Date(order.created_at).toLocaleDateString()}
• Total Amount: $${Number(order.total_amount || 0).toFixed(2)}

Ordered Items:
${order.order_items.map((item: any) => 
  `• ${item.product.title} (Quantity: ${item.quantity})`
).join('\n')}`)
        .replace('[Order details or important points]', 
          `Your order is currently ${order.status}. ${
            order.status === 'pending' ? 'We will process it shortly.' :
            order.status === 'confirmed' ? 'We are preparing your order.' :
            order.status === 'completed' ? 'Thank you for your business.' :
            order.status === 'cancelled' ? 'Please contact us if you have any questions.' :
            'Please contact us if you need any updates.'
          }`)
        .replace('[Relevant dates or deadlines]', 
          order.installation_date ? 
          `Installation is scheduled for ${order.installation_date}${order.installation_time ? ` at ${order.installation_time}` : ''}.` :
          'We will contact you to schedule any necessary installation or setup.')
        .replace('[Any action items required]',
          order.status === 'pending' ? 'Please review the order details and let us know if any adjustments are needed.' :
          order.status === 'confirmed' ? 'No action is required from you at this time.' :
          order.status === 'completed' ? 'Please let us know if you need any assistance with your products or services.' :
          'Please contact us if you have any questions or concerns.')
        .replace('[Additional context or instructions if needed]',
          order.notes ? `Additional Notes: ${order.notes}` : '')
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove extra blank lines
        .trim()
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

    return NextResponse.json({ html: formattedEmail })
  } catch (error) {
    console.error('Error generating email:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate email' },
      { status: 500 }
    )
  }
}

async function formatEmailPreview(content: string, order: any): Promise<string> {
  // Format order items if they exist
  const orderItemsList = order.order_items?.length > 0 
    ? `
      <div class="order-items">
        <h4 style="margin: 16px 0 8px 0;">Order Items:</h4>
        ${order.order_items.map((item: any) => `
          <div class="order-item">
            <span>${item.product.title}</span>
            <span>Quantity: ${item.quantity}</span>
          </div>
        `).join('')}
      </div>
    `
    : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Order Email</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #374151;
            background-color: #f9fafb;
          }
          .email-container {
            max-width: 600px;
            margin: 40px auto;
            padding: 32px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .content {
            margin-bottom: 32px;
            white-space: pre-line;
          }
          .order-details {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
          }
          .order-detail {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .order-items {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
          }
          .order-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            color: #4b5563;
            font-size: 14px;
          }
          .contact-info {
            margin-top: 32px;
            padding: 24px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          .signature {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="content">
            ${content}
          </div>

          <div class="order-details">
            <h3>Order Details</h3>
            <div class="order-detail">
              <span class="order-label">Order ID</span>
              <span class="order-value">#${order?.id || 'N/A'}</span>
            </div>
            <div class="order-detail">
              <span class="order-label">Order Date</span>
              <span class="order-value">${new Date(order?.created_at).toLocaleDateString()}</span>
            </div>
            <div class="order-detail">
              <span class="order-label">Customer</span>
              <span class="order-value">${order?.first_name || ''} ${order?.last_name || ''}</span>
            </div>
            <div class="order-detail">
              <span class="order-label">Total</span>
              <span class="order-value">$${Number(order?.total_amount || 0).toFixed(2)}</span>
            </div>
            <div class="order-detail">
              <span class="order-label">Status</span>
              <span class="order-value">${order?.status || 'N/A'}</span>
            </div>
            ${order?.notes ? `
            <div class="order-detail">
              <span class="order-label">Notes</span>
              <span class="order-value">${order.notes}</span>
            </div>
            ` : ''}
            ${orderItemsList}
          </div>

          <div class="contact-info">
            <h3>Need Assistance?</h3>
            <p>Our team is here to help! Contact us:</p>
            <p>
              Phone: (310) 872-9781<br>
              Email: help@wayofglory.com
            </p>
          </div>

          <div class="signature">
            <p style="font-weight: 600; color: #111827;">Best regards,</p>
            <p style="color: #111827;">Way of Glory Media Team</p>
            <p style="color: #6b7280; font-size: 14px;">Customer Success</p>
          </div>
        </div>
      </body>
    </html>
  `
} 