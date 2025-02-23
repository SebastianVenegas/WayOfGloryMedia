import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import OpenAI from 'openai';
import { formatEmailContent } from '@/lib/email-templates';

// Add a price formatting helper
const formatPrice = (price: number | string | null | undefined): string => {
  if (price === null || price === undefined) return '0.00';
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(numericPrice) ? '0.00' : numericPrice.toFixed(2);
};

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

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const orderId = request.nextUrl.pathname.split('/')[4];
    const orderIdInt = parseInt(orderId);

    if (isNaN(orderIdInt)) {
      console.error('Invalid orderId format:', orderId);
      return NextResponse.json({ error: 'Invalid Order ID' }, { status: 400 });
    }

    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is missing');
      return NextResponse.json({ error: 'Server configuration error', details: 'OpenAI API key is missing' }, { status: 500 });
    }

    // Parse and validate request body
    const body = await request.json();
    const { prompt, content: inputContent } = body;
    
    // Use either prompt or content, with prompt taking precedence
    const userContent = prompt || inputContent || 'Write a professional email update';

    // Fetch order details from database
    const result = await sql`
      SELECT 
        o.*,
        COALESCE(json_agg(
          json_build_object(
            'quantity', oi.quantity,
            'price_at_time', oi.price_at_time,
            'product', json_build_object(
              'title', p.title,
              'description', p.description,
              'category', p.category
            )
          )
        ) FILTER (WHERE oi.id IS NOT NULL), '[]') as order_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = ${orderIdInt}
      GROUP BY o.id;
    `;

    if (result.rows.length === 0) {
      console.error('Order not found:', orderIdInt);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = result.rows[0];

    // Process order items with proper price formatting
    const orderItems = orderData.order_items?.map((item: OrderItem) => {
      const quantity = Number(item.quantity) || 0;
      const priceAtTime = typeof item.price_at_time === 'string' ? 
        parseFloat(item.price_at_time) : 
        Number(item.price_at_time) || 0;
      const total = quantity * priceAtTime;
      
      return {
        title: item.product?.title || 'Product',
        quantity,
        price: formatPrice(total),
        pricePerUnit: formatPrice(priceAtTime),
        price_at_time: formatPrice(priceAtTime),
        product: item.product
      };
    }) || [];

    // Calculate totals
    const subtotal = orderItems.reduce((sum: number, item: { price: string | number }) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price) || 0;
      return sum + price;
    }, 0);

    const taxAmount = Number(orderData.tax_amount) || 0;
    const installationPrice = Number(orderData.installation_price) || 0;
    const totalAmount = subtotal + taxAmount + installationPrice;

    // Format variables for email template
    const variables = {
      orderId: orderIdInt,
      firstName: orderData.first_name,
      lastName: orderData.last_name,
      email: orderData.email,
      status: orderData.status,
      installationDate: orderData.installation_date,
      installationTime: orderData.installation_time,
      includesInstallation: !!orderData.installation_date,
      includesTraining: false,
      order_items: orderItems,
      subtotal: formatPrice(subtotal),
      tax_amount: formatPrice(taxAmount),
      installation_price: formatPrice(installationPrice),
      totalAmount: formatPrice(totalAmount),
      createdAt: orderData.created_at,
      companyName: 'Way of Glory Media',
      supportEmail: 'help@wayofglory.com',
      logoUrl: '/images/logo/LogoLight.png'
    };

    const AI_EMAIL_CONFIG = {
      model: "gpt-4",
      temperature: 0.7,
      max_tokens: 2000,
      system_prompt: `You are writing a final email for Way of Glory Media. Use these EXACT customer details:

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
1. Write the final email exactly as it will be sent
2. Use the customer's actual name ("${variables.firstName}")
3. Use the actual order number (${variables.orderId})
4. NEVER use placeholders like [Name] or [Order Number]
5. NEVER use XXXX or generic numbers
6. Include the support email and phone number exactly as provided above
7. NEVER mention any employee names - always use "our team" or "the Way of Glory team"
8. NEVER sign the email with a specific person's name or placeholder - ALWAYS end with "The Way of Glory Team"
9. This is the FINAL email that will be sent - NO placeholders of any kind are allowed
10. Do NOT use [your name], [name], [signature] or any other placeholder in the signature

SIGNATURE RULES:
✓ CORRECT: "Best regards, The Way of Glory Team"
✗ INCORRECT: "Best regards, [Your Name]"
✗ INCORRECT: "Sincerely, [Name]"
✗ INCORRECT: "Thanks, [Representative Name]"

EXAMPLES:
CORRECT: "Dear ${variables.firstName}, Thank you for your order #${variables.orderId}. Our team will... Best regards, The Way of Glory Team"
INCORRECT: "Dear [Name], Thank you for your order #[Order Number]. John will... Best regards, [Your Name]"
INCORRECT: "Dear Customer, Thank you for your order #XXXX. Mike from our team... Sincerely, [Name]"

Remember: This is the FINAL version that will be sent to the customer. Every placeholder must be replaced with actual data.`
    };

    // Log request details
    console.log('Generating custom email with:', {
      orderId: orderIdInt,
      promptLength: userContent?.length || 0,
      promptPreview: userContent?.substring(0, 100) + '...' || '',
      customerName: `${variables.firstName} ${variables.lastName}`,
      hasInstallation: variables.includesInstallation,
      hasTraining: variables.includesTraining,
      variablesProvided: Object.keys(variables)
    });

    // Initialize OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    try {
      // Generate email content with timeout and validation
      let completion;
      try {
        completion = await Promise.race([
          openai.chat.completions.create({
            model: AI_EMAIL_CONFIG.model,
            temperature: AI_EMAIL_CONFIG.temperature,
            max_tokens: AI_EMAIL_CONFIG.max_tokens,
            messages: [
              {
                role: "system",
                content: `You are writing a final email for Way of Glory Media. Use these EXACT customer details:

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
1. Write the final email exactly as it will be sent
2. Use the customer's actual name ("${variables.firstName}")
3. Use the actual order number (${variables.orderId})
4. NEVER use placeholders like [Name] or [Order Number]
5. NEVER use XXXX or generic numbers
6. Include the support email and phone number exactly as provided above
7. NEVER mention any employee names - always use "our team" or "the Way of Glory team"
8. NEVER sign the email with a specific person's name or placeholder - ALWAYS end with "The Way of Glory Team"
9. This is the FINAL email that will be sent - NO placeholders of any kind are allowed
10. Do NOT use [your name], [name], [signature] or any other placeholder in the signature
11. NEVER mention any employee names - always use "our team" or "the Way of Glory team"

SIGNATURE RULES:
✓ CORRECT: "Best regards, The Way of Glory Team"
✗ INCORRECT: "Best regards, [Your Name]"
✗ INCORRECT: "Sincerely, [Name]"
✗ INCORRECT: "Thanks, [Representative Name]"

EXAMPLES:
CORRECT: "Dear ${variables.firstName}, Thank you for your order #${variables.orderId}. Our team will... Best regards, The Way of Glory Team"
INCORRECT: "Dear [Name], Thank you for your order #[Order Number]. John will... Best regards, [Your Name]"
INCORRECT: "Dear Customer, Thank you for your order #XXXX. Mike from our team... Sincerely, [Name]"

Remember: This is the FINAL version that will be sent to the customer. Every placeholder must be replaced with actual data.`
              },
              {
                role: "user",
                content: `Write the final email using the exact customer information provided above:

${userContent}

Remember:
• Use "${variables.firstName}" as the customer's name
• Reference Order #${variables.orderId}
• Include our contact details exactly as provided
• Write the final version - no placeholders allowed`
              }
            ]
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('OpenAI request timed out')), 30000)
          )
        ]) as OpenAI.Chat.ChatCompletion;
      } catch (error) {
        console.error('OpenAI API error:', {
          error,
          orderId: orderIdInt,
          attempt: 1
        });
        
        // Retry once with different temperature
        try {
          completion = await openai.chat.completions.create({
            ...AI_EMAIL_CONFIG,
            temperature: 0.7,
            messages: [
              {
                role: "system",
                content: `CRITICAL: Replace ALL placeholders with these exact values:
First Name = "${variables.firstName}"
Order Number = "${variables.orderId}"

EXAMPLES OF REQUIRED REPLACEMENTS:
✗ "Dear [Customer's First Name]," -> ✓ "Dear ${variables.firstName},"
✗ "Order #XXXX" -> ✓ "Order #${variables.orderId}"
✗ "Hello [Name]" -> ✓ "Hello ${variables.firstName}"

ABSOLUTE REQUIREMENTS:
1. Use "${variables.firstName}" for ALL customer name references
2. Use "${variables.orderId}" for ALL order number references
3. NO placeholders or brackets [] allowed
4. NO generic numbers (XXXX) allowed
5. EVERY customer reference must use actual name`
              },
              {
                role: "user",
                content: `RETRY - Replace ALL placeholders in this email:

${userContent}

MANDATORY REPLACEMENTS:
• [Customer's First Name] → "${variables.firstName}"
• [Order number] → "${variables.orderId}"
• [Name] → "${variables.firstName}"
• XXXX → "${variables.orderId}"

CHECK EACH LINE:
1. Replace every instance of [Customer's First Name]
2. Replace every instance of [Order number]
3. Replace every instance of [Name]
4. Replace every instance of XXXX
5. Verify no placeholders remain`
              }
            ]
          });
        } catch (retryError) {
          throw new Error('Failed to generate custom email after retry');
        }
      }

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (!aiResponse || typeof aiResponse !== 'string') {
        throw new Error('Invalid response from AI service');
      }

      // Process the content
      let subject = aiResponse.match(/^(?:Subject:|Re:|Regarding:)\s*(.+?)[\n\r]/i)?.[1]?.trim() || 'Custom Email';
      let emailContent = aiResponse.trim();

      // Remove subject line if present
      emailContent = emailContent.replace(/^(?:Subject:|Re:|Regarding:)\s*.+?[\n\r]/, '').trim();

      // Basic validation
      if (emailContent.length < 20) {
        throw new Error('Generated email content too short');
      }

      // For creative content, skip the template formatting
      const isCreativeContent = !userContent.toLowerCase().includes('way of glory') && 
                              !userContent.toLowerCase().includes('order') &&
                              !userContent.toLowerCase().includes('business');

      let formattedContent;
      if (isCreativeContent) {
        // Create a simple HTML wrapper for creative content
        formattedContent = `
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
                  <img src="https://wayofglory.com/images/logo/logo.png" alt="Way of Glory Media" />
                </div>
                ${emailContent.split('\n').map(line => `<p>${line}</p>`).join('\n')}
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
      } else {
        // Use template formatting only for business emails
        try {
          formattedContent = formatEmailContent(emailContent, {
            ...variables,
            emailType: 'Custom Email',
            companyName: 'Way of Glory Media',
            supportEmail: 'help@wayofglory.com',
            websiteUrl: 'https://wayofglory.com',
            logoUrl: 'https://wayofglory.com/images/logo/LogoLight.png',
            logoNormalUrl: 'https://wayofglory.com/images/logo/logo.png',
            logoLightUrl: 'https://wayofglory.com/images/logo/LogoLight.png',
            year: new Date().getFullYear(),
            baseUrl: 'https://wayofglory.com'
          });
        } catch (formatError) {
          console.error('Email formatting error:', formatError);
          throw new Error('Failed to format email content');
        }
      }

      // Return the response
      return new NextResponse(
        JSON.stringify({
          subject,
          content: emailContent,
          html: formattedContent,
          success: true,
          isCreative: isCreativeContent,
          validation: {
            contentLength: emailContent.length,
            isFormatted: true
          }
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
          }
        }
      );

    } catch (aiError) {
      console.error('AI service error:', {
        error: aiError,
        message: aiError instanceof Error ? aiError.message : 'Unknown error',
        stack: aiError instanceof Error ? aiError.stack : undefined
      });

      return new NextResponse(
        JSON.stringify({ 
          error: 'Email generation failed',
          details: aiError instanceof Error ? aiError.message : 'AI service error',
          success: false
        }),
        { 
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          }
        }
      );
    }

  } catch (error) {
    console.error('Error in custom-email:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { 
        error: 'Email generation failed',
        details: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
} 