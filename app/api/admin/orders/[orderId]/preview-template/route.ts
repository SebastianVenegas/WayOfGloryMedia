import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getEmailTemplate, formatEmailContent, type Order } from '@/lib/email-templates';
import fs from 'fs/promises';
import path from 'path';
import { safeFetch } from '@/lib/safeFetch';

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

// Add the getBaseUrl helper to dynamically compute the base URL
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  return `${protocol}://${host}`;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  // Extract orderId from the pathname (assuming the URL structure: /api/admin/orders/[orderId]/preview-template)
  const orderId = request.nextUrl.pathname.split('/')[4];
  
  try {
    // Use absolute URLs for logos
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const logoLightUrl = '/images/logo/LogoLight.png';
    const logoNormalUrl = '/images/logo/logo.png';

    if (!orderId) {
      console.error('Missing orderId in URL');
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
    const orderItems = orderData.order_items?.map((item: {
      quantity: number;
      price_at_time: number;
      title?: string;
      pricePerUnit?: number;
      product?: { title?: string; category?: string };
    }) => ({
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
    const order: any = {
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

    // Generate content using the generate-email endpoint using safeFetch
    const baseUrlForGenerate = getBaseUrl(request);
    const generateUrl = new URL('/api/admin/generate-email', baseUrlForGenerate).toString();
    
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

    const generatePayload = {
      prompt: prompt,
      variables: {
        ...template.variables,
        order_items: orderItems,
        subtotal,
        tax_amount: taxAmount,
        installation_price: installationPrice,
        totalAmount
      }
    };

    let data;
    try {
      const response = await safeFetch(generateUrl, {
        method: 'POST',
        body: JSON.stringify(generatePayload)
      });
      data = response.data;
    } catch (err) {
      console.error('Error calling generate-email:', err);
      return NextResponse.json({ 
        error: 'Failed to generate email content',
        details: err instanceof Error ? err.message : 'Unknown error'
      }, { status: 500 });
    }

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
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error in preview-template:', err.message);
    console.error('Stack trace:', err.stack);
    return NextResponse.json({ 
      error: 'Failed to generate email preview',
      details: err.message
    }, { status: 500 });
  }
}