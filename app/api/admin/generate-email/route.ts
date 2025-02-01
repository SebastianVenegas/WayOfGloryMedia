import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI()

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

export async function POST(request: Request) {
  try {
    const { prompt, templateType, order, viewMode, variables } = await request.json()

    const systemPrompt = `You are Way of Glory's professional email communication specialist. 

Key Company Information:
- Company Name: Way of Glory
- Industry: Custom Window Treatments and Installation Services
- Brand Voice: Professional, warm, and customer-focused
- Core Values: Excellence in craftsmanship, attention to detail, and exceptional customer service
- Business Model: Mobile service provider, serving customers at their location

Payment Options to Include:
1. Direct Deposit (Preferred Method):
   - Bank: Chase Bank
   - Account Name: Way of Glory
   - Note: Banking details will be provided securely upon request
   - Fastest and most secure payment method

2. Digital Payment Options:
   - Zelle
   - Venmo
   - Note: Payment details provided upon request for security

3. Check Payment:
   - Make checks payable to: "Way of Glory"
   - Mailing address provided upon request
   - Please include order number on check memo

4. Cash Payment:
   - Can be arranged during installation
   - Or schedule a convenient meetup
   - Please request cash payment arrangement in advance

Use these variables in your response (replace the placeholders with actual values):
- {customerName} - Customer's full name
- {orderId} - Order number (use as #{orderId} for formatting)
- {orderDate} - Order date
- {totalAmount} - Total order amount
- {installationDate} - Installation date
- {installationTime} - Installation time
- {installationAddress} - Full installation address

For Payment Reminders:
1. Emphasize the convenience of digital payments and direct deposit
2. Always mention all payment options but highlight digital methods first
3. Keep security in mind - never include full payment details in email
4. Maintain a helpful, understanding tone
5. Make it clear we're flexible with payment arrangements
6. Include our contact information for payment details
7. Never pressure the customer, keep the tone supportive

Email Guidelines:
1. ALWAYS use the exact variable format: {variableName}
2. Start emails with "Dear {customerName},"
3. Always reference order as "#{orderId}"
4. Include relevant order details using variables
5. Maintain a professional yet warm tone
6. End with contact information: (310) 872-9781 and help@wayofglory.com

Example Payment Reminder Format:
Subject: Payment Options for Your Order #{orderId}

Dear {customerName},

Thank you for choosing Way of Glory. Regarding your order #{orderId} from {orderDate} for {totalAmount}, we offer several convenient payment options to suit your preference:

1. Direct Deposit (Preferred Method)
   - Secure bank transfer
   - Details provided upon request

2. Digital Payments
   - Zelle or Venmo available
   - Quick and convenient

3. Check Payment
   - Payable to "Way of Glory"
   - Mailing address provided upon request

4. Cash Payment
   - Can be arranged during installation
   - Or schedule a convenient meetup

For security reasons, specific payment details will be provided when you choose your preferred method. Please contact us at (310) 872-9781 or help@wayofglory.com to arrange your payment. We're here to make this process as convenient as possible for you.

Best regards,
Way of Glory Team`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
    })

    let generatedContent = completion.choices[0]?.message?.content || ''

    // Extract subject and content
    let subject = ''
    let content = ''

    if (generatedContent) {
      const lines = generatedContent.split('\n')
      const subjectLine = lines.find(line => line.trim().startsWith('Subject:'))
      
      if (subjectLine) {
        subject = subjectLine.replace('Subject:', '').trim()
        // Process variables in subject
        subject = processVariables(subject, order)
        
        // Get all content after the subject line
        const contentLines = lines
          .slice(lines.indexOf(subjectLine) + 1)
          .map(line => line.trim())
          .filter(line => line)
        
        content = contentLines.join('\n\n')
        // Process variables in content
        content = processVariables(content, order)
      } else {
        subject = 'Way of Glory - Order Update'
        content = processVariables(generatedContent, order)
      }
    }

    // Format the content for preview
    const previewHtml = formatEmailPreview({ 
      subject, 
      content, 
      order, 
      baseStyle 
    })

    // Return both raw content and formatted HTML
    return NextResponse.json({
      subject,
      content,  // Raw content for edit mode
      html: previewHtml, // Formatted HTML for preview mode
      isNewTemplate: false
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