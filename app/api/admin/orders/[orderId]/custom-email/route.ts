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

const AI_EMAIL_CONFIG = {
  model: "gpt-4",
  temperature: 0.9,
  max_tokens: 2000,
  system_prompt: `You are a creative email composer. Your PRIMARY and ONLY task is to write emails EXACTLY as specified in the user's prompt, with NO modifications or additions.

KEY RULES:
1. ONLY write what the prompt specifically requests
2. DO NOT add any Way of Glory Media content unless explicitly requested
3. DO NOT add any business/order information unless explicitly requested
4. DO NOT modify the creative direction of the prompt
5. DO NOT add contact information unless requested
6. DO NOT add greetings/closings unless they're part of the requested style
7. MAINTAIN the exact tone and style specified in the prompt

IMPORTANT:
- If the prompt is creative/fictional, write EXACTLY that
- If the prompt is business-related, write EXACTLY that
- NEVER default to a business template
- NEVER add company information unless requested
- NEVER modify the creative intent of the prompt

Your ONLY job is to write EXACTLY what the prompt requests - nothing more, nothing less.`
};

interface OrderItem {
  title?: string;
  quantity: number;
  price?: number;
  pricePerUnit?: number;
  price_at_time?: number | string;
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
                content: AI_EMAIL_CONFIG.system_prompt
              },
              {
                role: "user",
                content: `WRITE THIS EMAIL EXACTLY AS REQUESTED - NO MODIFICATIONS:

${userContent}

DO NOT:
- Add any Way of Glory Media content
- Add any business/order information
- Modify the creative direction
- Add contact information
- Add greetings/closings unless part of the requested style
- Default to a business template

WRITE EXACTLY WHAT WAS REQUESTED - NOTHING MORE, NOTHING LESS.`
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
            temperature: 0.9,
            messages: [
              {
                role: "system",
                content: `You are a creative email composer. Write EXACTLY what is requested - no business template, no modifications.

ABSOLUTE RULES:
1. Write ONLY what the prompt requests
2. DO NOT add any business content
3. DO NOT modify the creative direction
4. Keep the exact style and tone requested
5. NO default templates
6. NO company information
7. NO contact details unless requested`
              },
              {
                role: "user",
                content: `WRITE THIS EMAIL EXACTLY - NO CHANGES:

${userContent}

STRICT RULES:
1. Write ONLY the email requested
2. NO business template
3. NO company information
4. NO contact details
5. KEEP exact creative direction
6. MAINTAIN requested tone/style`
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
      let subject = `Custom Email - Way of Glory #${orderIdInt}`;
      let emailContent = aiResponse.trim();

      // Extract subject if provided in the content
      const subjectMatch = emailContent.match(/^(?:Subject:|Re:|Regarding:)\s*(.+?)[\n\r]/i);
      if (subjectMatch) {
        subject = subjectMatch[1].trim();
        emailContent = emailContent.replace(/^(?:Subject:|Re:|Regarding:)\s*.+?[\n\r]/, '').trim();
      }

      // Basic validation - only check length
      if (emailContent.length < 20) {
        throw new Error('Generated email content too short');
      }

      // Format the content with error handling
      let formattedContent;
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

      // Return the response
      return new NextResponse(
        JSON.stringify({
          subject,
          content: emailContent,
          html: formattedContent,
          success: true,
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
            'Surrogate-Control': 'no-store',
            'x-content-validation': 'passed'
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