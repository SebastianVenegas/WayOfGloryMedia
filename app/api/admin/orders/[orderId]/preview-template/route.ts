import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getEmailTemplate, formatEmailContent, type Order } from '@/lib/email-templates';
import fs from 'fs/promises';
import path from 'path';

interface OrderItem {
  quantity: number;
  price_at_time: number;
  title?: string;
  pricePerUnit?: number;
  product?: {
    title?: string;
    category?: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Record<string, string> }
): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;

  try {
    // Use absolute URLs for logos
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const logoLightUrl = '/images/logo/LogoLight.png';
    const logoNormalUrl = '/images/logo/logo.png';

    const orderId = params.orderId;
    if (!orderId) {
      console.error('Missing orderId in params');
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }
    const orderId_int = parseInt(orderId);
    if (isNaN(orderId_int)) {
      console.error('Invalid orderId format:', orderId);
      return NextResponse.json({ error: 'Invalid Order ID' }, { status: 400 });
    }

    const templateId = searchParams.get('templateId');
    if (!templateId) {
      console.error('Missing templateId in query params');
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    console.log('Preview template request:', {
      orderId: orderId_int,
      templateId
    });

    // Fetch order details with order items
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
      WHERE o.id = ${orderId_int}
      GROUP BY o.id;
    `;

    if (result.rows.length === 0) {
      console.error('Order not found:', orderId_int);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = result.rows[0];

    // Calculate order totals
    const orderItems = orderData.order_items?.map((item: OrderItem) => ({
      title: item.product?.title || 'Product',
      quantity: Number(item.quantity),
      price: Number(item.price_at_time) * Number(item.quantity),
      pricePerUnit: Number(item.price_at_time),
      product: item.product
    })) || [];

    const subtotal = orderItems.reduce((sum: number, item: { price: number }) => sum + item.price, 0);
    const taxAmount = Number(orderData.tax_amount || 0);
    const installationPrice = Number(orderData.installation_price || 0);
    const totalAmount = subtotal + taxAmount + installationPrice;

    // Cast the database result to Order type
    const order: Order = {
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
      installation_date: orderData.installation_date
    };

    let template;
    let prompt;

    if (templateId === 'custom') {
      const customPrompt = searchParams.get('prompt');
      if (!customPrompt) {
        return NextResponse.json({ error: "Custom prompt is required" }, { status: 400 });
      }

      template = {
        subject: `Order Update - Way of Glory #${order.id}`,
        prompt: customPrompt,
        variables: {
          orderId: order.id,
          firstName: order.first_name,
          lastName: order.last_name,
          email: order.email,
          totalAmount: totalAmount,
          createdAt: order.created_at,
          status: order.status,
          order_items: orderItems,
          subtotal: subtotal,
          tax_amount: taxAmount,
          installation_price: installationPrice,
          companyName: 'Way of Glory Media',
          supportEmail: 'help@wayofglory.com',
          websiteUrl: 'https://wayofglory.com',
          logoUrl: logoLightUrl,
          year: new Date().getFullYear(),
          emailType: 'Order Update'
        }
      };
      prompt = customPrompt;
    } else {
      template = getEmailTemplate(templateId, order);
      if (!template) {
        console.error('Template not found:', templateId);
        return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
      }
      template.variables = {
        ...template.variables,
        logoUrl: logoLightUrl
      };
      prompt = template.prompt;
    }

    // Generate content using the generate-email endpoint
    const generateUrl = new URL('/api/admin/generate-email', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').toString();
    
    console.log('Generating email with:', {
      templateId,
      prompt: prompt.substring(0, 100) + '...',
      variables: {
        ...template.variables,
        order_items: orderItems,
        subtotal,
        tax_amount: taxAmount,
        installation_price: installationPrice,
        totalAmount
      }
    });

    const generateResponse = await fetch(generateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt: prompt,
        variables: {
          ...template.variables,
          order_items: orderItems,
          subtotal,
          tax_amount: taxAmount,
          installation_price: installationPrice,
          totalAmount
        }
      })
    });

    if (!generateResponse.ok) {
      const errorData = await generateResponse.json().catch(() => ({}));
      console.error('Generate email failed:', {
        status: generateResponse.status,
        statusText: generateResponse.statusText,
        error: errorData
      });
      return NextResponse.json({ 
        error: 'Failed to generate email content',
        details: errorData.error || errorData.details || generateResponse.statusText
      }, { status: generateResponse.status });
    }

    const data = await generateResponse.json();
    
    if (!data.html || !data.content) {
      console.error('Invalid response from generate-email:', data);
      return NextResponse.json({ 
        error: 'Generate email returned invalid content',
        details: 'Missing html or content in response'
      }, { status: 500 });
    }

    // Format the email with all order details
    const formattedHtml = formatEmailContent(data.content, {
      ...template.variables,
      order_items: orderItems,
      subtotal,
      tax_amount: taxAmount,
      installation_price: installationPrice,
      totalAmount,
      emailType: template.variables.emailType || 'Order Update',
      logoUrl: logoLightUrl
    });

    return NextResponse.json({
      subject: template.subject,
      content: data.content,
      html: formattedHtml
    });

  } catch (error) {
    console.error('Error in preview-template:', error);
    return NextResponse.json({ 
      error: 'Failed to generate email preview',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}