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
    const { 
      orderId, 
      templateId = 'custom', 
      content, 
      isPWA = false,
      prompt: customPrompt,
      templateType,
      order: providedOrder,
      viewMode,
      variables 
    } = await req.json()

    // Use provided order if available, otherwise fetch from database
    let order = providedOrder
    if (!order && orderId) {
      const result = await sql`
        SELECT id, customer_name, email, status, total, created_at, notes
        FROM orders 
        WHERE id = ${orderId}
      `
      order = result.rows[0]
    }

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found',
        subject: '',
        content: '',
        html: '',
        isNewTemplate: false
      }, { status: 404 })
    }

    // Convert Decimal to string and null values to undefined
    const orderWithStringAmount = {
      ...order,
      total: order.total.toString()
    }

    let prompt = customPrompt || ''
    if (!prompt) {
      if (templateId === 'custom' && content) {
        prompt = `Please help improve and professionally format this email content while maintaining its core message. Make it more engaging and on-brand for Way of Glory Media:

${content}

Please ensure the response maintains a professional tone and includes all necessary information from the original content.`
      } else {
        prompt = getEmailPrompt(templateId || templateType, orderWithStringAmount)
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert email composer for Way of Glory Media, a professional audio and visual solutions company. Your task is to generate or improve email content that maintains the company's professional image while being clear and engaging. Important guidelines:

1. Never mention any physical addresses or office locations
2. Always use 'contact us' instead of 'contact our office'
3. Always sign emails as 'Way of Glory Team' or 'Way of Glory Media Team'
4. Never use placeholders like [Your Name] or [Representative Name]
5. Keep the tone professional but warm
6. Always include our contact methods (phone and email) for questions`
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
      return NextResponse.json({
        success: false,
        error: 'Failed to generate email content',
        subject: '',
        content: '',
        html: '',
        isNewTemplate: false
      }, { status: 500 })
    }

    const subject = templateId === 'custom' 
      ? 'Custom Email' 
      : `Way of Glory Media - ${(templateId || templateType).replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}`

    // Format content based on view mode
    const formattedContent = viewMode === 'preview' 
      ? formatEmailPreview({ 
          subject, 
          content: generatedContent, 
          order: orderWithStringAmount, 
          baseStyle: '' 
        })
      : generatedContent

    return NextResponse.json({
      success: true,
      error: null,
      subject,
      content: generatedContent,
      html: formattedContent,
      isNewTemplate: false
    })
  } catch (error) {
    console.error('Error generating email:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate email',
      subject: '',
      content: '',
      html: '',
      isNewTemplate: false
    }, { status: 500 })
  }
}

function formatEmailPreview({ subject, content, order, baseStyle }: { 
  subject: string;
  content: string;
  order: Order;
  baseStyle: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${subject}</title>
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
          h1, h2, h3 {
            color: #111827;
            margin-bottom: 16px;
            font-weight: 600;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 24px;
          }
          h2 {
            font-size: 20px;
          }
          h3 {
            font-size: 16px;
          }
          p {
            margin-bottom: 16px;
            line-height: 1.6;
          }
          .content {
            margin-bottom: 32px;
          }
          .order-card {
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
          .contact-info {
            margin-top: 32px;
            padding: 24px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          .contact-info h3 {
            margin-bottom: 12px;
          }
          .contact-info p {
            margin-bottom: 8px;
          }
          .signature {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
            text-align: left;
          }
          .signature-name {
            font-weight: 600;
            color: #111827;
            margin-bottom: 4px;
          }
          .signature-title {
            color: #64748b;
            font-size: 14px;
          }
          ul, ol {
            margin: 16px 0;
            padding-left: 24px;
          }
          li {
            margin: 8px 0;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="order-details">
            <h3>Order Details</h3>
            <div class="order-detail">
              <span class="order-label">Order ID</span>
              <span class="order-value">#${order.id}</span>
            </div>
            <div class="order-detail">
              <span class="order-label">Customer</span>
              <span class="order-value">${order.customer_name}</span>
            </div>
            <div class="order-detail">
              <span class="order-label">Total</span>
              <span class="order-value">$${Number(order.total).toFixed(2)}</span>
            </div>
            <div class="order-detail">
              <span class="order-label">Status</span>
              <span class="order-value">${order.status}</span>
            </div>
            ${order.notes ? `
            <div class="order-detail">
              <span class="order-label">Notes</span>
              <span class="order-value">${order.notes}</span>
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