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
  system_prompt: `You are an email composer for Way of Glory Media. Your task is to write custom emails that STRICTLY FOLLOW the user's prompt while maintaining our professional standards and structure.

PRIORITY ORDER:
1. Follow the user's prompt EXACTLY - this is your primary goal
2. Maintain professional structure and tone
3. Include required information
4. Follow formatting guidelines
5. Dont ever mention the prompt in the email
6. Dont say anthing you are not sure about
7. You must follow the professional structure and tone
8. You must follow the formatting guidelines
9. You must follow the restrictions
10. You must follow the priority order
11. You must follow the professional structure and tone
12. Make sure to include all the information requested in the prompt
13. If you dont know the answer, you can contact us at help@wayofglory.com

PROFESSIONAL STRUCTURE (maintain this structure while incorporating the prompt):
1. Opening Greeting
   - Always address by first name
   - Warm and professional tone
   - Reference order number early

2. Main Content (this is where you follow the prompt exactly)
   - Focus on the specific purpose from the prompt
   - Keep information clear and organized
   - Use short paragraphs (2-4 sentences)
   - Include any prompt-specific details

3. Next Steps/Action Items
   - Clear instructions if any
   - What to expect next
   - Only include if relevant to the prompt

4. Contact Information
   - Email: help@wayofglory.com
   - Phone: (310) 872-9781
   - Always include both

5. Professional Closing
   - Warm but professional
   - Sign as "The Way of Glory Media Team"

TONE REQUIREMENTS:
- Professional yet warm
- Clear and direct
- Solution-focused
- Confident but humble

FORMATTING:
- Plain text only
- Double line breaks between sections
- Single line breaks between paragraphs
- No HTML or special formatting
- Use dashes (-) for lists

RESTRICTIONS:
- Never mention physical locations
- Never mention specific employee names
- Don't include pricing details
- Don't make delivery time assumptions
- Don't mention installation/training unless it's part of the order
- Don't add content that wasn't requested in the prompt

IMPORTANT: 
1. The prompt's content and purpose should be the main focus of the email
2. Maintain the professional structure while adapting it to the prompt's needs
3. Don't add extra content that wasn't requested
4. Always include order number and contact details
5. Keep the tone consistently professional`
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
      // Generate email content with timeout
      const completion = await Promise.race([
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
              content: `Write a custom email for order #${variables.orderId} following these requirements:

${userContent}

CUSTOMER DETAILS:
- Name: ${variables.firstName} ${variables.lastName}
- Order #${variables.orderId}
- Status: ${variables.status}
${variables.includesInstallation ? `- Installation Date: ${variables.installationDate}
- Installation Time: ${variables.installationTime}` : ''}
${variables.includesTraining ? '- Training service included' : ''}

Remember to:
1. Write directly to the customer (not about what to write)
2. Keep the tone professional and warm
3. Include order number and relevant details
4. Maintain Way of Glory Media's voice`
            }
          ]
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OpenAI request timed out')), 30000) // Increased timeout to 30 seconds
        )
      ]) as OpenAI.Chat.ChatCompletion;

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (!aiResponse || typeof aiResponse !== 'string') {
        throw new Error('Invalid response from AI service');
      }

      // Process the content
      let subject = `Order Update - Way of Glory #${orderIdInt}`;
      let emailContent = aiResponse.trim();

      // Extract subject if present (improved regex)
      const subjectMatch = emailContent.match(/^(?:Subject:|Re:|Regarding:)\s*(.+?)[\n\r]/i);
      if (subjectMatch) {
        subject = subjectMatch[1].trim();
        emailContent = emailContent.replace(/^(?:Subject:|Re:|Regarding:)\s*.+?[\n\r]/, '').trim();
      }

      // Format the content
      const formattedContent = formatEmailContent(emailContent, {
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

      // Return the response
      return new NextResponse(
        JSON.stringify({
          subject,
          content: emailContent,
          html: formattedContent,
          success: true
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