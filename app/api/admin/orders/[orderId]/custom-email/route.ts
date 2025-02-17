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
  system_prompt: `You are an email composer for Way of Glory Media. Your primary task is to write custom emails that STRICTLY FOLLOW the user's prompt while maintaining professional standards.

PRIORITY ORDER:
1. Follow the user's prompt EXACTLY - this is your primary goal
2. Maintain professional tone and standards
3. Include required information
4. Follow formatting guidelines

KEY REQUIREMENTS:
- Write the email EXACTLY as requested in the prompt
- Do NOT add content that wasn't requested unless absolutely necessary
- Do NOT follow a template structure unless specifically asked
- Do NOT ignore any part of the user's prompt
- Always include the order number somewhere in the email

TONE GUIDELINES (only apply these if they don't conflict with the prompt):
- Professional but warm
- Clear and direct
- Solution-focused

REQUIRED ELEMENTS:
- Email: help@wayofglory.com
- Phone: (310) 872-9781
- Company Name: Way of Glory Media

RESTRICTIONS:
- Never mention physical office locations
- Never mention specific employee names
- Don't include pricing details
- Don't make delivery time assumptions
- Don't mention installation/training unless it's part of the order

FORMAT:
- Plain text only
- Double line breaks between paragraphs
- No HTML or special formatting

IMPORTANT: Your main goal is to write exactly what was requested in the prompt while incorporating these guidelines naturally. Don't add extra content or follow a template unless specifically asked.`
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

    // Generate email content
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
          content: `PROMPT: ${userContent}

REQUIRED ORDER CONTEXT:
- Customer: ${variables.firstName} ${variables.lastName}
- Order #${variables.orderId}
${variables.includesInstallation ? `- Installation scheduled for ${variables.installationDate} at ${variables.installationTime}` : ''}
- Current status: ${variables.status}
${variables.includesInstallation ? '- Installation is included' : '- No installation included'}
${variables.includesTraining ? '- Training is included' : '- No training included'}

Write the email exactly as requested in the prompt while naturally incorporating this order information. Don't add any content that wasn't specifically requested.`
        }
      ]
    });

    const aiResponse = completion.choices[0]?.message?.content;
    
    // Validate OpenAI response
    if (!aiResponse || typeof aiResponse !== 'string') {
      console.error('OpenAI returned invalid content:', { aiResponse });
      return NextResponse.json(
        { error: 'Generation failed', details: 'Invalid or empty content returned from AI' },
        { status: 500 }
      );
    }

    // Process the content
    let subject = `Order Update - Way of Glory #${orderIdInt}`;
    let emailContent = aiResponse.trim();

    // Extract subject if present
    const subjectMatch = emailContent.match(/^(?:subject:|re:|regarding:)\s*(.+?)(?:\n|$)/i);
    if (subjectMatch) {
      subject = subjectMatch[1].trim();
      emailContent = emailContent.replace(/^(?:subject:|re:|regarding:)\s*.+?\n/, '').trim();
    }

    // Validate processed content
    if (!emailContent) {
      console.error('Empty content after processing');
      return NextResponse.json(
        { error: 'Processing failed', details: 'Email content is empty after processing' },
        { status: 500 }
      );
    }

    // Log the generated content for debugging
    console.log('Generated email content:', {
      prompt: userContent,
      subject,
      contentPreview: emailContent.substring(0, 200) + '...'
    });

    // Format the content using the same template as other emails
    const formattedContent = formatEmailContent(emailContent, {
      ...variables,
      emailType: subject.replace(' - Way of Glory', '').replace(` #${variables.orderId}`, ''),
      companyName: 'Way of Glory Media',
      supportEmail: 'help@wayofglory.com',
      logoUrl: '/images/logo/LogoLight.png',
      logoNormalUrl: '/images/logo/logo.png',
      year: new Date().getFullYear(),
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    });

    // Return the response
    return NextResponse.json({
      subject,
      content: emailContent,
      html: formattedContent
    });

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