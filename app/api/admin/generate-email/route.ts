import { NextResponse } from 'next/server'
import OpenAI from 'openai'

interface OrderItem {
  title?: string;
  quantity: number;
  price?: number;
  pricePerUnit?: number;
  price_at_time?: number;
  product?: {
    title?: string;
    description?: string;
  };
}

const formatEmailContent = (content: string, variables: Record<string, any>) => {
  // Split content into paragraphs and wrap them in styled divs
  const formattedContent = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line)
    .map(line => line.startsWith('<p>') ? line : `<p style="margin: 0 0 16px 0; line-height: 1.6;">${line}</p>`)
    .join('\n');

  // Get the base URL from environment or default to localhost
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const logoFullUrl = `${baseUrl}${variables.logoUrl}`;

  // Calculate subtotal from order items if not provided
  const subtotal = variables.subtotal ?? (variables.order_items?.reduce((sum: number, item: OrderItem) => {
    const price = Number(item.price_at_time || item.pricePerUnit || 0);
    const quantity = Number(item.quantity || 0);
    return sum + (price * quantity);
  }, 0) || 0);

  // Calculate tax amount if not provided
  const taxAmount = Number(variables.tax_amount || variables.taxAmount || 0);

  // Calculate installation price if not provided
  const installationPrice = Number(variables.installation_price || variables.installationPrice || 0);

  // Calculate total amount if not provided
  const totalAmount = Number(variables.total_amount || variables.totalAmount || (subtotal + taxAmount + installationPrice));

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #f4f4f5;
            -webkit-font-smoothing: antialiased;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
          }
          .wrapper {
            width: 100%;
            background-color: #f4f4f5;
            padding: 40px 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(to right, #2563eb, #3b82f6);
            padding: 32px 40px;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content-wrapper {
            padding: 40px;
          }
          .content {
            color: #374151;
            font-size: 16px;
            line-height: 1.6;
          }
          .content p {
            margin: 0 0 16px 0;
          }
          .order-details {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
          }
          .order-details h3 {
            color: #1e293b;
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 12px 0;
          }
          .order-detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .order-detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            color: #64748b;
            font-size: 14px;
          }
          .detail-value {
            color: #0f172a;
            font-size: 14px;
            font-weight: 500;
          }
          .signature {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
          }
          .signature-name {
            color: #1e293b;
            font-weight: 600;
            margin: 0 0 4px 0;
          }
          .signature-title {
            color: #64748b;
            font-size: 14px;
            margin: 0 0 16px 0;
          }
          .footer {
            background-color: #f8fafc;
            padding: 24px 40px;
            border-top: 1px solid #e2e8f0;
          }
          .footer p {
            color: #64748b;
            font-size: 14px;
            margin: 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="email-container">
            <div class="header">
              <h1>Dear ${variables.firstName},</h1>
            </div>
            
            <div class="content-wrapper">
              <div class="content">
                ${formattedContent}
              </div>

              <div class="order-details">
                <h3>Order Details</h3>
                <div class="order-detail-row">
                  <span class="detail-label">Order Number</span>
                  <span class="detail-value">#${variables.orderId}</span>
                </div>
                <div class="order-detail-row">
                  <span class="detail-label">Total Amount</span>
                  <span class="detail-value">$${totalAmount.toFixed(2)}</span>
                </div>
                ${installationPrice > 0 ? `
                <div class="order-detail-row">
                  <span class="detail-label">Installation Price</span>
                  <span class="detail-value">$${installationPrice.toFixed(2)}</span>
                </div>
                ` : ''}
              </div>

              <div class="signature">
                <p class="signature-name">Way of Glory Team</p>
                <p class="signature-title">Customer Success Team</p>
                <div style="margin-top: 16px;">
                  <img src="${logoFullUrl}" alt="Way of Glory" style="height: 40px;" />
                </div>
              </div>
            </div>

            <div class="footer">
              <p>If you have any questions, please don't hesitate to contact us at ${variables.supportEmail}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key is missing');
    return NextResponse.json({ error: 'OpenAI API key is missing' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { prompt, variables } = body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      console.error('Invalid or missing prompt:', { prompt });
      return NextResponse.json({ error: 'Invalid or missing prompt' }, { status: 400 });
    }

    if (!variables || typeof variables !== 'object') {
      console.error('Invalid or missing variables:', { variables });
      return NextResponse.json({ error: 'Invalid or missing variables' }, { status: 400 });
    }

    console.log('Generating email with:', {
      prompt: prompt.substring(0, 100) + '...',
      variables: {
        orderId: variables.orderId,
        firstName: variables.firstName,
        lastName: variables.lastName,
        emailType: variables.emailType,
        itemCount: variables.order_items?.length
      }
    });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const AI_EMAIL_CONFIG = {
      model: "gpt-4",
      temperature: 0.7,
      max_tokens: 2000,
      system_prompt: `You are the email composer for Way of Glory Media, a professional audio and visual solutions company. 
      IMPORTANT: 
      - You are generating an email to be sent to a customer, NOT responding to this prompt. Write the email directly.
      - NEVER use placeholders like [Name], [Your Name], [Address], etc. Always use the actual provided variables.
      - Write the email as if it's ready to be sent immediately.

      TONE & STYLE:
      - Professional yet warm and approachable
      - Clear and concise
      - Enthusiastic about enhancing worship experiences
      - Confident but humble
      - Solution-oriented and helpful

      FORMATTING:
      - Use proper paragraph breaks for readability
      - Keep paragraphs short (2-4 sentences)
      - Use bullet points for lists or steps
      - Include clear section breaks

      CONTENT RULES:
      1. NEVER use placeholder text - use the actual provided variables
      2. NEVER mention or reference any physical office location
      3. Only use these payment methods:
         - Direct bank transfer (Account details provided separately)
         - Check payments (Payable to "Way of Glory Media")
      4. Only use these contact methods:
         - Email: help@wayofglory.com
         - Phone: (310) 872-9781
      5. Always include order number in communications
      6. Never mention specific employee names
      7. Always refer to "our team" or "the Way of Glory team"
      8. Focus on digital communication and remote support
      9. For installations, emphasize coordination with customer
      10. Use accurate pricing from provided variables
      11. Don't make assumptions about delivery times
      12. Don't say anything that you are not sure about

      STRUCTURE:
      1. Opening: Warm, personal greeting using customer's actual first name
      2. Purpose: Clear statement of email's purpose
      3. Details: Relevant information, clearly organized
      4. Next Steps: Clear action items or expectations
      5. Support: Contact information
      6. Closing: Warm, professional sign-off

      BRANDING:
      - Company Name: Way of Glory Media
      - Mission: Enhancing worship experiences
      - Values: Excellence, Professionalism, Service
      - Voice: Modern, Professional, Ministry-Focused`
    };

    console.log('Using AI config:', {
      model: AI_EMAIL_CONFIG.model,
      temperature: AI_EMAIL_CONFIG.temperature,
      max_tokens: AI_EMAIL_CONFIG.max_tokens
    });

    // Generate content using AI with specific instructions
    const completion = await openai.chat.completions.create({
      model: AI_EMAIL_CONFIG.model,
      temperature: AI_EMAIL_CONFIG.temperature,
      max_tokens: AI_EMAIL_CONFIG.max_tokens,
      messages: [
        {
          role: "system",
          content: AI_EMAIL_CONFIG.system_prompt
        },
        {
          role: "user",
          content: prompt
        }
      ]
    }).catch(error => {
      console.error('OpenAI API error:', {
        error,
        message: error.message,
        type: error.type,
        code: error.code
      });
      throw new Error(`OpenAI API error: ${error.message}`);
    });

    const emailContent = completion.choices[0]?.message?.content;
    
    if (!emailContent) {
      console.error('OpenAI returned no content:', completion);
      return NextResponse.json(
        { error: 'Failed to generate email content', details: 'OpenAI returned no content' },
        { status: 500 }
      );
    }

    console.log('Generated content successfully, length:', emailContent.length);

    try {
      // Format the email with consistent styling
      const formattedEmail = formatEmailContent(emailContent, {
        ...variables,
        emailType: variables.emailType || 'Order Update'
      });

      console.log('Formatted email successfully, length:', formattedEmail.length);

      // Return both the raw content and formatted HTML
      return NextResponse.json({ 
        html: formattedEmail,
        content: emailContent
      });
    } catch (formatError) {
      console.error('Error formatting email:', {
        error: formatError,
        message: formatError instanceof Error ? formatError.message : 'Unknown error',
        content: emailContent.substring(0, 200) + '...'
      });
      throw new Error('Failed to format email content');
    }

  } catch (error) {
    console.error('Error generating email:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Failed to generate email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 