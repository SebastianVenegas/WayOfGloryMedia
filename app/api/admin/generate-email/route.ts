import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { formatEmailContent } from '@/lib/email-templates'
import { sql } from '@vercel/postgres'
import { NextRequest } from 'next/server'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

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

// Add price formatting helper
const formatPrice = (price: number | string | null | undefined): string => {
  if (price === null || price === undefined) return '0.00'
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price
  return isNaN(numericPrice) ? '0.00' : numericPrice.toFixed(2)
}

// Add numeric conversion helper
const toNumber = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) return 0
  const num = typeof value === 'string' ? parseFloat(value) : value
  return isNaN(num) ? 0 : num
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, variables, isPWA } = body;

    // Validate required customer information
    if (!variables?.firstName || !variables?.lastName || !variables?.orderId) {
      return new NextResponse(JSON.stringify({ 
        error: 'Missing required customer information',
        details: 'First name, last name, and order ID are required',
        success: false,
        isPWA,
        content: null,
        html: null
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }

    if (!prompt) {
      return new NextResponse(JSON.stringify({ 
        error: 'Prompt is required',
        success: false,
        isPWA,
        content: null,
        html: null
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }

    try {
      // Log the variables being used
      console.log('Generating email with variables:', {
        firstName: variables.firstName,
        lastName: variables.lastName,
        orderId: variables.orderId,
        email: variables.email,
        status: variables.status
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are writing a final email for Way of Glory Media. You MUST use these EXACT customer details:

CUSTOMER INFORMATION (REQUIRED - DO NOT MODIFY):
• First Name: "${variables.firstName}"
• Last Name: "${variables.lastName}"
• Order Number: ${variables.orderId}
• Email: ${variables.email}
• Order Status: ${variables.status}

COMPANY INFORMATION (REQUIRED - DO NOT MODIFY):
• Company: Way of Glory Media
• Support Email: help@wayofglory.com
• Support Phone: (310) 872-9781
• Website: wayofglory.com

STRICT RULES:
1. You MUST use the customer's EXACT name "${variables.firstName}" - NEVER use [Name] or any placeholder
2. You MUST use the EXACT order number ${variables.orderId} - NEVER use [Order Number] or any placeholder
3. You MUST use the EXACT support email and phone number as provided above
4. NEVER use placeholders like [Customer Name], [Order ID], etc.
5. NEVER use XXXX or generic numbers
6. NEVER modify the customer or company information provided above
7. If you need to reference the customer or order, use ONLY the exact values provided above
8. NEVER mention any employee names - always use "our team" or "the Way of Glory team"
9. NEVER sign the email with a specific person's name or placeholder - ALWAYS end with "The Way of Glory Team"
10. This is the FINAL email that will be sent - NO placeholders of any kind are allowed
11. Do NOT use [your name], [name], [signature] or any other placeholder in the signature
12. NEVER mention any employee names - always use "our team" or "the Way of Glory team"

SIGNATURE RULES:
✓ CORRECT: "Best regards, The Way of Glory Team"
✗ INCORRECT: "Best regards, [Your Name]"
✗ INCORRECT: "Sincerely, [Name]"
✗ INCORRECT: "Thanks, [Representative Name]"

EXAMPLES:
CORRECT: "Dear ${variables.firstName}, Thank you for your order #${variables.orderId}. Our team will... Best regards, The Way of Glory Team"
INCORRECT: "Dear [Name], Thank you for your order #[Order Number]. John will... Best regards, [Your Name]"
INCORRECT: "Dear Customer, Thank you for your order #XXXX. Mike from our team... Sincerely, [Name]"

Write the final email exactly as it will be sent, with no placeholders or modifications to the provided information.`
          },
          {
            role: "user",
            content: `Write the final email using ONLY the exact customer information provided above. DO NOT use any placeholders.

${prompt}

IMPORTANT REMINDERS:
• You MUST use "${variables.firstName}" as the customer's name - no placeholders
• You MUST use Order #${variables.orderId} - no placeholders
• You MUST use our exact contact details as provided
• This is the final version that will be sent - no placeholders or modifications allowed`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = completion.choices[0]?.message?.content;

      if (!content) {
        console.error('No content generated from OpenAI');
        return new NextResponse(JSON.stringify({
          error: 'No content generated',
          success: false,
          isPWA,
          content: null,
          html: null
        }), { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        });
      }

      // Update logo URLs based on PWA status
      const baseUrl = 'https://wayofglory.com';
      
      // Ensure logo URLs are always absolute
      const logoLight = 'https://wayofglory.com/images/logo/LogoLight.png';
      const logoNormal = 'https://wayofglory.com/images/logo/logo.png';

      const formattedVariables = {
        ...variables,
        logoUrl: logoNormal,
        logoNormalUrl: logoNormal,
        logoLightUrl: logoLight,
        baseUrl,
        companyName: 'Way of Glory Media',
        supportEmail: 'help@wayofglory.com',
        websiteUrl: 'https://wayofglory.com',
        isPWA: true
      };

      // Format the content with proper styling
      const formattedHtml = formatEmailContent(content, formattedVariables);

      // Add styling wrapper if not present
      const styledHtml = formattedHtml.includes('<!DOCTYPE html>') ? formattedHtml : `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="color-scheme" content="light">
            <style>
              body {
                margin: 0;
                padding: 20px;
                background-color: #ffffff;
                -webkit-font-smoothing: antialiased;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                color: #374151;
                font-size: 16px;
                line-height: 1.6;
                word-wrap: break-word;
                overflow-wrap: break-word;
                max-width: 100%;
              }
              p {
                margin: 1em 0;
                line-height: 1.6;
                white-space: pre-wrap;
                word-wrap: break-word;
                overflow-wrap: break-word;
              }
              img {
                max-width: 100%;
                height: auto;
                display: block;
              }
              .content-wrapper {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background: #ffffff;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              }
              .header {
                text-align: center;
                padding: 20px;
                background: linear-gradient(135deg, #2563eb, #1d4ed8);
                border-radius: 8px 8px 0 0;
                margin: -20px -20px 20px -20px;
              }
              .header img {
                width: 180px;
                margin: 0 auto;
              }
              .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 1em 0;
              }
              th, td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #e5e7eb;
              }
              th {
                background-color: #f9fafb;
                font-weight: 600;
              }
              a {
                color: #2563eb;
                text-decoration: none;
              }
              a:hover {
                text-decoration: underline;
              }
              .button {
                display: inline-block;
                padding: 12px 24px;
                background-color: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 500;
                margin: 1em 0;
              }
              .button:hover {
                background-color: #1d4ed8;
                text-decoration: none;
              }
              @media (max-width: 600px) {
                body {
                  padding: 10px;
                }
                .content-wrapper {
                  padding: 15px;
                }
                .header {
                  margin: -15px -15px 15px -15px;
                }
              }
            </style>
          </head>
          <body>
            <div class="content-wrapper">
              <div class="header">
                <img src="${logoNormal}" alt="Way of Glory Media" />
              </div>
              ${formattedHtml}
              <div class="footer">
                <p>© ${new Date().getFullYear()} Way of Glory Media. All rights reserved.</p>
                <p>
                  <a href="mailto:help@wayofglory.com">help@wayofglory.com</a> |
                  <a href="tel:+13108729781">(310) 872-9781</a> |
                  <a href="https://wayofglory.com">wayofglory.com</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

      // Return both the raw content and formatted HTML
      return new NextResponse(JSON.stringify({
        content,
        html: styledHtml,
        success: true,
        isPWA: true,
        message: 'Email content generated successfully'
      }), { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });

    } catch (error: any) {
      console.error('OpenAI API Error:', {
        error: error.message,
        stack: error.stack,
        details: error.response?.data || error.data || error
      });
      
      return new NextResponse(JSON.stringify({
        error: 'Failed to generate email content',
        details: error.message || 'An error occurred during email generation',
        success: false,
        isPWA,
        content: null,
        html: null,
        errorData: {
          message: error.message,
          type: error.type || error.name,
          status: error.status || 500,
          details: error.response?.data || error.data || null
        }
      }), { 
        status: error.status || 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }
  } catch (error: any) {
    console.error('Request processing error:', {
      error: error.message,
      stack: error.stack,
      details: error.response?.data || error.data || error
    });
    
    return new NextResponse(JSON.stringify({
      error: 'Failed to process request',
      details: error.message || 'Invalid request format',
      success: false,
      isPWA: false,
      content: null,
      html: null,
      errorData: {
        message: error.message,
        type: error.type || error.name,
        status: error.status || 400,
        details: error.response?.data || error.data || null
      }
    }), { 
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }
} 