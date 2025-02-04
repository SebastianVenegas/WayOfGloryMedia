import { NextResponse } from 'next/server'
import { getEmailPrompt, getEmailTemplate, wrapContent, sanitizeHtml } from '@/lib/email-templates'
import prisma from '@/lib/prisma'
import OpenAI from 'openai'
import { Decimal } from '@prisma/client/runtime/library'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface Order {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  total_amount: Decimal;
  installation_date?: string | null;
  installation_time?: string | null;
  installation_address?: string | null;
  installation_city?: string | null;
  installation_state?: string | null;
  installation_zip?: string | null;
  shipping_address?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_zip?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

interface EmailResponse {
  subject: string;
  html: string;
  content: string;
  isNewTemplate: boolean;
}

// Function to process variables in content
function processVariables(content: string, order: any) {
  const customerName = `${order.first_name} ${order.last_name}`.trim()
  
  return content
    // Customer Information
    .replace(/\{customerName\}/g, customerName)
    .replace(/\{firstName\}/g, order.first_name)
    .replace(/\{lastName\}/g, order.last_name)
    .replace(/\{email\}/g, order.email)
    .replace(/\{phone\}/g, order.phone || 'Not provided')
    .replace(/\{organization\}/g, order.organization || 'Not provided')

    // Order Information
    .replace(/\{orderId\}/g, order.id)
    .replace(/\#\{orderId\}/g, `#${order.id}`)
    .replace(/\{orderDate\}/g, new Date(order.created_at).toLocaleDateString())
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
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { orderId, templateId = 'custom', content, isPWA = false } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Fetch order details
    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
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
        created_at: true,
        updated_at: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Convert Prisma Decimal to proper type
    const orderWithSerializedAmount = {
      ...order,
      total_amount: order.total_amount as unknown as Decimal,
    }

    let prompt = ''
    if (templateId === 'custom' && content) {
      // For custom templates, use the provided content as context
      prompt = `Please help improve and professionally format this email content while maintaining its core message. Make it more engaging and on-brand for Way of Glory Media:

${content}

Please ensure the response maintains a professional tone and includes all necessary information from the original content.`
    } else {
      // Use predefined template prompts
      prompt = getEmailPrompt(templateId, orderWithSerializedAmount)
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert email composer for Way of Glory Media, a professional audio and visual solutions company. Your task is to generate or improve email content that maintains the company's professional image while being clear and engaging."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const generatedContent = completion.choices[0]?.message?.content
    if (!generatedContent) {
      return NextResponse.json({ error: 'Failed to generate email content' }, { status: 500 })
    }

    // Create the email template
    const emailTemplate = getEmailTemplate('custom', orderWithSerializedAmount, {
      subject: templateId === 'custom' ? 'Way of Glory Media - Order Update' : `${templateId.replace(/_/g, ' ')} - Way of Glory Media`,
      html: generatedContent
    }, isPWA)

    return NextResponse.json({
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      content: generatedContent,
      isNewTemplate: true
    })
  } catch (error) {
    console.error('Error generating email:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate email'
    }, { 
      status: 500 
    })
  }
}

function formatEmailEdit(content: string): string {
  // For edit mode, return content with proper line breaks
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line)
    .join('\n\n') // Double newline for better paragraph separation
}

// Define base styling for better email appearance
const baseStyle = `
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      line-height: 1.5;
      color: #111827;
      -webkit-font-smoothing: antialiased;
    }
    .email-container {
      max-width: 600px;
      margin: 40px auto;
      padding: 40px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    h1 {
      font-size: 28px;
      font-weight: 600;
      margin: 0 0 32px 0;
      padding: 0;
      color: #111827;
    }
    .content {
      font-size: 16px;
      line-height: 1.6;
      color: #374151;
    }
    .content p {
      margin: 0 0 16px 0;
      padding: 0;
    }
    .content p:last-child {
      margin-bottom: 0;
    }
    .content ul {
      margin: 16px 0;
      padding: 0 0 0 24px;
    }
    .content li {
      margin: 8px 0;
      padding: 0;
      line-height: 1.5;
    }
    .footer {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 4px 0;
      color: #6b7280;
      font-size: 14px;
      line-height: 1.5;
    }
  </style>
`

function formatEmailPreview({ subject, content, order, baseStyle }: { 
  subject: string;
  content: string;
  order: Order;
  baseStyle: string;
}): string {
  const formattedContent = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line)
    .map(line => line.startsWith('<p>') ? line : `<p>${line}</p>`)
    .join('\n')

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${baseStyle}
        <style>
          .order-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
          }
          .order-card h3 {
            color: #1e293b;
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 12px 0;
          }
          .order-detail {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .order-detail:last-child {
            border-bottom: none;
          }
          .order-label {
            color: #64748b;
            font-size: 14px;
          }
          .order-value {
            color: #0f172a;
            font-size: 14px;
            font-weight: 500;
          }
          .signature {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
          }
          .signature img {
            height: 60px;
            margin-bottom: 12px;
          }
          .signature-name {
            font-weight: 600;
            color: #0f172a;
            margin: 0;
          }
          .signature-title {
            color: #64748b;
            font-size: 14px;
            margin: 4px 0;
          }
          .signature-contact {
            color: #64748b;
            font-size: 14px;
            margin: 4px 0;
          }
          .contact-info {
            margin-top: 24px;
            padding: 16px;
            background: #f8fafc;
            border-radius: 6px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <h1>Dear ${order.first_name},</h1>
          <div class="content">
            ${formattedContent}
          </div>

          <div class="order-card">
            <h3>Order Details</h3>
            <div class="order-detail">
              <span class="order-label">Order Number</span>
              <span class="order-value">#${order.id}</span>
            </div>
            <div class="order-detail">
              <span class="order-label">Total Amount</span>
              <span class="order-value">$${order.total_amount.toFixed(2)}</span>
            </div>
            ${order.installation_date ? `
            <div class="order-detail">
              <span class="order-label">Installation Date</span>
              <span class="order-value">${order.installation_date}</span>
            </div>
            ` : ''}
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
            <p class="signature-name">Way of Glory Media Team</p>
            <p class="signature-title">Customer Success</p>
          </div>
        </div>
      </body>
    </html>
  `
} 