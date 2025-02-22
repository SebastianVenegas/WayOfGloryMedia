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
  temperature: 0.8,
  max_tokens: 2000,
  system_prompt: `You are an email composer for Way of Glory Media. Your task is to write custom emails that EXACTLY FOLLOW the user's prompt while maintaining our professional standards.

MOST IMPORTANT RULES:
1. Follow the user's prompt EXACTLY - this is your absolute top priority
2. Generate ONLY what the user asks for in their prompt
3. Do not add any content that wasn't specifically requested
4. Do not default to a thank you email
5. Do not ignore the user's specific instructions

STRUCTURE (only use relevant parts based on the prompt):
1. Opening: Use customer's first name
2. Content: EXACTLY what the user's prompt specifies
3. Closing: Professional but matching the tone requested in prompt
4. Include order number where appropriate
5. Include contact info only if relevant to prompt

TONE:
- Match the tone requested in the prompt
- If no tone specified, keep it professional but natural
- Avoid overly formal language unless requested

RESTRICTIONS:
- Never mention physical locations
- Never mention specific employee names
- Only include pricing if specifically requested
- Only mention installation/training if relevant to prompt

CONTACT INFO (only include if relevant):
- Email: help@wayofglory.com
- Phone: (310) 872-9781`
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
                content: `Write exactly this type of email for order #${variables.orderId}:

${userContent}

Available Information (only use what's relevant to the prompt):
- Customer: ${variables.firstName} ${variables.lastName}
- Order #${variables.orderId}
- Status: ${variables.status}
${variables.includesInstallation ? `- Installation Date: ${variables.installationDate}
- Installation Time: ${variables.installationTime}` : ''}

IMPORTANT: 
1. Follow the prompt EXACTLY
2. Only include information that's relevant to the prompt
3. Do not add content that wasn't requested
4. Do not default to a thank you email
5. Write the email directly (not about what to write)`
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
                content: AI_EMAIL_CONFIG.system_prompt + "\n\nIMPORTANT: This is a retry attempt. Follow the prompt EXACTLY as written - do not modify or add to it."
              },
              {
                role: "user",
                content: `RETRY REQUEST - Write exactly this email, no modifications:

${userContent}

Order Information (only use if relevant to prompt):
- Customer: ${variables.firstName} ${variables.lastName}
- Order #${variables.orderId}
${variables.includesInstallation ? `- Installation Date: ${variables.installationDate}
- Installation Time: ${variables.installationTime}` : ''}

STRICT REQUIREMENTS:
1. Generate EXACTLY what was requested - no additions
2. Do not add any content not specified in the prompt
3. Do not default to a generic or thank you email
4. Keep ONLY the content requested in the original prompt`
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

      // Validate email content
      if (!aiResponse.includes(variables.firstName) || !aiResponse.includes(orderIdInt.toString())) {
        throw new Error('Generated email missing required information');
      }

      // Process the content
      let subject = `Order Update - Way of Glory #${orderIdInt}`;
      let emailContent = aiResponse.trim();

      // Extract and validate subject
      const subjectMatch = emailContent.match(/^(?:Subject:|Re:|Regarding:)\s*(.+?)[\n\r]/i);
      if (subjectMatch) {
        const extractedSubject = subjectMatch[1].trim();
        if (extractedSubject.length >= 10 && extractedSubject.length <= 100) {
          subject = extractedSubject;
          emailContent = emailContent.replace(/^(?:Subject:|Re:|Regarding:)\s*.+?[\n\r]/, '').trim();
        }
      }

      // Validate email content length
      if (emailContent.length < 50) {
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

      // Validate formatted content
      if (!formattedContent.includes('way-of-glory-email')) {
        throw new Error('Email formatting validation failed');
      }

      // Return the response with validation headers
      return new NextResponse(
        JSON.stringify({
          subject,
          content: emailContent,
          html: formattedContent,
          success: true,
          validation: {
            hasCustomerName: true,
            hasOrderNumber: true,
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