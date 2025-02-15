import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { formatEmailContent } from '@/lib/email-templates'
import { sql } from '@vercel/postgres'

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

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key is missing');
    return NextResponse.json({ error: 'OpenAI API key is missing' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { orderId, content, isPWA } = body;
    
    if (!orderId) {
      console.error('Missing orderId:', { orderId });
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Fetch order details
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
      WHERE o.id = ${orderId}
      GROUP BY o.id;
    `;

    if (result.rows.length === 0) {
      console.error('Order not found:', orderId);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = result.rows[0];

    // Process order items with proper price formatting
    const orderItems = orderData.order_items?.map((item: any) => {
      const quantity = toNumber(item.quantity);
      const priceAtTime = toNumber(item.price_at_time);
      
      return {
        title: item.product?.title || 'Product',
        quantity: quantity,
        price: formatPrice(quantity * priceAtTime),
        pricePerUnit: formatPrice(priceAtTime),
        product: item.product
      };
    }) || [];

    // Calculate totals with proper formatting
    const subtotal = orderItems.reduce((sum: number, item: any) => 
      sum + (toNumber(item.price)), 0);
    const taxAmount = toNumber(orderData.tax_amount);
    const installationPrice = toNumber(orderData.installation_price);
    const totalAmount = subtotal + taxAmount + installationPrice;

    const variables = {
      orderId: orderData.id,
      firstName: orderData.first_name,
      lastName: orderData.last_name,
      email: orderData.email,
      status: orderData.status,
      installationDate: orderData.installation_date,
      installationTime: orderData.installation_time,
      order_items: orderItems,
      subtotal: formatPrice(subtotal),
      tax_amount: formatPrice(taxAmount),
      installation_price: formatPrice(installationPrice),
      totalAmount: formatPrice(totalAmount),
      createdAt: orderData.created_at,
      companyName: 'Way of Glory Media',
      supportEmail: 'help@wayofglory.com',
      websiteUrl: 'https://wayofglory.com',
      logoUrl: '/images/logo/LogoLight.png',
      year: new Date().getFullYear(),
      emailType: 'Order Update'
    };

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const AI_EMAIL_CONFIG = {
      model: "gpt-4",
      temperature: 0.7,
      max_tokens: 2000,
      system_prompt: `You are the email composer for Way of Glory Media, a professional audio and visual solutions company. 
      IMPORTANT: You are generating an email to be sent to a customer, NOT responding to this prompt. Write the email directly.

      TONE & STYLE:
      - Professional yet warm and approachable
      - Clear and concise
      - Enthusiastic about enhancing worship experiences
      - Confident but humble
      - Solution-oriented and helpful

      FORMATTING:
      - Write in plain text only - NO HTML or styling
      - Use proper paragraph breaks for readability (use double newlines)
      - Keep paragraphs short (2-4 sentences)
      - Use simple dashes (-) for lists
      - DO NOT include order items or pricing - this will be added automatically
      - DO NOT add any styling or formatting tags

      CONTENT RULES:
      1. NEVER mention or reference any physical office location
      2. Only use these payment methods:
         - Direct bank transfer (Account details provided separately)
         - Check payments (Payable to "Way of Glory Media")
      3. Only use these contact methods:
         - Email: help@wayofglory.com
         - Phone: (310) 872-9781
      4. Always include order number in communications
      5. Never mention specific employee names
      6. Always refer to "our team" or "the Way of Glory team"
      7. Focus on digital communication and remote support
      8. For installations, emphasize coordination with customer
      9. DO NOT list products or prices - these will be added automatically
      10. Don't make assumptions about delivery times
      11. Don't say anything that you are not sure about
      12. If the customer did not order a service such as "installation" or "training", do not mention it in the email

      STRUCTURE:
      1. Opening: Warm, personal greeting using first name
      2. Purpose: Clear statement of email's purpose
      3. Details: Relevant information (excluding product details)
      4. Next Steps: Clear action items or expectations
      5. Support: Contact information
      6. Closing: Warm, professional sign-off

      BRANDING:
      - Company Name: Way of Glory Media
      - Mission: Enhancing worship experiences
      - Values: Excellence, Professionalism, Service
      - Voice: Modern, Professional, Ministry-Focused`
    };

    // Generate content using AI
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
          content: content || `Write a professional email update for Order #${orderId}`
        }
      ]
    });

    const emailContent = completion.choices[0]?.message?.content;
    
    if (!emailContent) {
      console.error('OpenAI returned no content:', completion);
      return NextResponse.json(
        { error: 'Failed to generate email content', details: 'OpenAI returned no content' },
        { status: 500 }
      );
    }

    // Format the email with all order details
    const formattedHtml = formatEmailContent(emailContent, variables);

    return NextResponse.json({
      subject: `Order Update - Way of Glory #${orderId}`,
      content: emailContent,
      html: formattedHtml
    });

  } catch (error) {
    console.error('Error generating email:', error);
    return NextResponse.json({ 
      error: 'Failed to generate email',
      details: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
} 