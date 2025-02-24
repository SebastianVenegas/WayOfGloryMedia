import { sql } from '@vercel/postgres';
import { getEmailTemplate, formatEmailContent, type Order as EmailOrder } from '@/lib/email-templates';
import { NextResponse, NextRequest } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to format price
function formatPrice(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toFixed(2);
}

// Helper function to convert to number
function toNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

// Order type definition
interface Order extends Omit<EmailOrder, 'subtotal'> {
  subtotal?: string;
}

async function getOrder(orderId: number): Promise<EmailOrder | null> {
  try {
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
      return null;
    }

    const orderData = result.rows[0];
    const orderItems = orderData.order_items?.map((item: any) => ({
      title: item.product?.title || 'Product',
      quantity: toNumber(item.quantity),
      price: toNumber(toNumber(item.quantity) * toNumber(item.price_at_time)),
      pricePerUnit: toNumber(item.price_at_time),
      product: item.product
    })) || [];

    const subtotal = orderItems.reduce((sum: number, item: any) => 
      sum + toNumber(item.price), 0);
    const taxAmount = toNumber(orderData.tax_amount);
    const installationPrice = toNumber(orderData.installation_price);
    const totalAmount = subtotal + taxAmount + installationPrice;

    return {
      id: orderData.id,
      first_name: orderData.first_name,
      last_name: orderData.last_name,
      email: orderData.email,
      total_amount: totalAmount,
      tax_amount: taxAmount,
      created_at: orderData.created_at,
      status: orderData.status,
      order_items: orderItems,
      installation_price: installationPrice,
      installation_date: orderData.installation_date,
      installation_time: orderData.installation_time,
      subtotal: subtotal
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  // Add CORS and cache prevention headers
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
    'X-PWA-Generated': 'true',
    'X-PWA-Version': '1.0'
  };

  try {
    // Extract orderId from the URL
    const segments = request.nextUrl.pathname.split('/');
    const orderIdString = segments[4];
    if (!orderIdString) {
      return new NextResponse(JSON.stringify({ error: 'Order ID parameter missing' }), {
        status: 400,
        headers
      });
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    const customPrompt = searchParams.get('prompt');
    const isPWA = request.headers.get('x-pwa-request') === 'true';

    if (!templateId) {
      return new NextResponse(JSON.stringify({ error: 'Template ID is required' }), {
        status: 400,
        headers
      });
    }

    const order = await getOrder(parseInt(orderIdString));
    if (!order) {
      return new NextResponse(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers
      });
    }

    // Get the email template configuration
    const template = getEmailTemplate(templateId, order);

    // For custom emails, use the provided prompt
    const finalPrompt = customPrompt || template.prompt;

    try {
      // Generate the email content using OpenAI with a timeout
      const completion = await Promise.race([
        openai.chat.completions.create({
          model: template.variables.ai_config.model,
          temperature: template.variables.ai_config.temperature,
          max_tokens: template.variables.ai_config.max_tokens,
          messages: [
            {
              role: 'system',
              content: template.variables.ai_config.system_prompt
            },
            {
              role: 'user',
              content: finalPrompt
            }
          ]
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OpenAI request timed out')), 20000)
        )
      ]) as OpenAI.Chat.ChatCompletion;

      const emailContent = completion.choices[0]?.message?.content;

      if (!emailContent) {
        console.error('No content generated from OpenAI');
        return new NextResponse(JSON.stringify({ 
          error: 'No content generated',
          isPWA,
          success: false
        }), {
          status: 500,
          headers
        });
      }

      // Format the email with the template
      const formattedEmail = formatEmailContent(emailContent, {
        ...template.variables,
        isPWA: true,
        baseUrl: 'https://wayofglory.com',
        logoUrl: 'https://wayofglory.com/images/logo/logo.png',
        logoNormalUrl: 'https://wayofglory.com/images/logo/logo.png',
        logoLightUrl: 'https://wayofglory.com/images/logo/LogoLight.png'
      });

      // Return with PWA-specific headers
      return new NextResponse(
        JSON.stringify({
          content: emailContent,
          html: formattedEmail,
          subject: template.subject,
          isPWA,
          success: true
        }),
        { headers }
      );

    } catch (aiError) {
      console.error('AI service error:', aiError);
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to generate email content',
          details: aiError instanceof Error ? aiError.message : 'Unknown error',
          isPWA,
          success: false
        }),
        {
          status: 503,
          headers
        }
      );
    }

  } catch (error) {
    console.error('Error generating email template:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to generate email template',
        details: error instanceof Error ? error.message : 'Unknown error',
        isPWA: request.headers.get('x-pwa-request') === 'true',
        success: false
      }),
      {
        status: 500,
        headers
      }
    );
  }
}