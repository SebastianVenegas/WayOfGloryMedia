import { NextResponse } from 'next/server'
import { getEmailPrompt } from '@/lib/email-templates'
import prisma from '@/lib/prisma'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface Order {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  total_amount: string | number;
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
      order = await prisma.order.findUnique({
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
        },
      })
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
      total_amount: order.total_amount.toString(),
      installation_date: order.installation_date || undefined,
      installation_time: order.installation_time || undefined,
      installation_address: order.installation_address || undefined,
      installation_city: order.installation_city || undefined,
      installation_state: order.installation_state || undefined,
      installation_zip: order.installation_zip || undefined,
      shipping_address: order.shipping_address || undefined,
      shipping_city: order.shipping_city || undefined,
      shipping_state: order.shipping_state || undefined,
      shipping_zip: order.shipping_zip || undefined
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
              <span class="order-value">$${order.total_amount}</span>
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