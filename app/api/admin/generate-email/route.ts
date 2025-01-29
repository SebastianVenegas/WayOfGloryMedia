import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface Order {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  total_amount: number | string;
  installation_date?: string;
}

interface EmailResponse {
  subject: string;
  html: string;
  content: string;
  isNewTemplate: boolean;
}

export async function POST(request: Request) {
  try {
    const { prompt, order, templateType, viewMode, isTemplateChange } = await request.json()

    // If this is just a template change, return empty content
    if (isTemplateChange) {
      return NextResponse.json({
        subject: '',
        html: '',
        content: '',
        isNewTemplate: true
      })
    }

    // Create a system message that explains the context and requirements
    const systemMessage = `You are an AI assistant helping to generate email content for Way of Glory. Generate a concise, professional email following this structure:

    Subject: [Write a clear subject line]

    [Write your main content here as plain text with each paragraph separated by newlines. Do not include any HTML tags - they will be added automatically. Be specific and factual, do not include any made-up information.]

    Order Details:
    - Customer: ${order.first_name} ${order.last_name}
    - Order #${order.id}
    - Amount: $${order.total_amount}
    - Installation Date: ${order.installation_date}

    USER PROMPT: ${prompt}

    IMPORTANT: 
    1. Be concise and factual
    2. Do not include any made-up information
    3. Only reference the actual order details provided
    4. Keep the email focused and professional
    5. Write content as plain text, not HTML
    6. Each paragraph should be on a new line`

    // Get completion from OpenAI with optimized settings
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { 
          role: "system", 
          content: "You are a concise email generator. Generate plain text content that will be formatted into HTML later. Never include HTML tags in your response."
        },
        { 
          role: "user", 
          content: systemMessage 
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
      presence_penalty: -0.5,
    })

    // Extract the generated content
    const generatedContent = completion.choices[0].message.content

    // Split the content into subject and body
    let subject = ''
    let content = ''

    if (generatedContent) {
      const lines = generatedContent.split('\n')
      const subjectLine = lines.find(line => line.trim().startsWith('Subject:'))
      
      if (subjectLine) {
        subject = subjectLine.replace('Subject:', '').trim()
        
        // Get all content after the subject line
        content = lines
          .slice(lines.indexOf(subjectLine) + 1)
          .map(line => line.trim())
          .filter(line => line)
          .join('\n')
      } else {
        subject = 'Way of Glory - Order Update'
        content = generatedContent
      }
    }

    // Format the content based on view mode
    const formattedContent = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .map(line => `${line}\n`)
      .join('')

    const previewHtml = formatEmailPreview({ 
      subject, 
      content: formattedContent, 
      order, 
      baseStyle 
    })

    return NextResponse.json({
      subject,
      html: previewHtml,
      content: formattedContent,
      isNewTemplate: false,
      editContent: formattedContent
    })
  } catch (error) {
    console.error('Error generating email content:', error)
    return NextResponse.json(
      { error: 'Failed to generate email content' },
      { status: 500 }
    )
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

          <div class="signature">
            <img src="https://wayofglory.com/signature.png" alt="Digital Signature" />
            <p class="signature-name">Way of Glory Team</p>
            <p class="signature-title">Customer Success Team</p>
            <p class="signature-contact">
              Email: support@wayofglory.com<br>
              Phone: (555) 123-4567
            </p>
          </div>
        </div>
      </body>
    </html>
  `
} 