import { sql } from '@vercel/postgres';
import { getEmailTemplate, formatEmailContent, type Order as EmailOrder } from '@/lib/email-templates';
import { NextResponse, NextRequest } from 'next/server';

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
  // Extract orderId from the URL. Expected URL: /api/admin/orders/{orderId}/preview-template
  const segments = request.nextUrl.pathname.split('/');
  // segments: ['', 'api', 'admin', 'orders', '{orderId}', 'preview-template']
  const orderIdString = segments[4];
  if (!orderIdString) {
    return new NextResponse(JSON.stringify({ error: 'Order ID parameter missing' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    const customPrompt = searchParams.get('prompt');

    if (!templateId) {
      return new NextResponse(JSON.stringify({ error: 'Template ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const order = await getOrder(parseInt(orderIdString));
    if (!order) {
      return new NextResponse(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the email template configuration
    const template = getEmailTemplate(templateId, order);

    // For custom emails, use the provided prompt; fallback to template.prompt or a default message
    const finalPrompt = customPrompt || template.prompt || `Generate email content for order #${order.id}`;

    // Generate the email content using the AI service with a timeout and no-cache option
    const openAIRequest = fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
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
        })
      }
    );
    const timeoutPromise = new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('OpenAI API request timed out')), 30000)
    );

    let emailContent: string;
    try {
      const generateResponse = await Promise.race([openAIRequest, timeoutPromise]);
      if (!generateResponse.ok) {
        console.error('AI service error:', await generateResponse.text());
        throw new Error('Failed to generate email content');
      }
      const aiResponse = await generateResponse.json();
      emailContent = aiResponse.choices[0]?.message?.content;
      if (!emailContent) {
        throw new Error('No content generated');
      }
    } catch (e) {
      console.error('Error in OpenAI generation:', e);
      // Always fallback to a default email content if any error occurs
      emailContent = 'Thank you for your order. We are processing your request and will update you shortly with complete details.';
    }

    // Format the email with the template
    const formattedEmail = formatEmailContent(emailContent, template.variables);
    // Fallback for subject if it's empty
    const finalSubject = template.subject || 'Your Order Update';

    return new NextResponse(
      JSON.stringify({
        content: emailContent,
        html: formattedEmail,
        subject: finalSubject
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    );

  } catch (error) {
    console.error('Error generating email template:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to generate email template' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}