import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getEmailTemplate, formatEmailContent, type Order } from '@/lib/email-templates';
import fs from 'fs/promises';
import path from 'path';
import { safeFetch } from '@/lib/safeFetch';

// Add price formatting helper
const formatPrice = (price: number | string | null | undefined): string => {
  if (price === null || price === undefined) return '0.00';
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(numericPrice) ? '0.00' : numericPrice.toFixed(2);
};

// Add numeric conversion helper
const toNumber = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
};

interface OrderItem {
  quantity: number;
  price_at_time: number | string;
  title?: string;
  pricePerUnit?: number;
  product?: {
    title?: string;
    category?: string;
  };
}

// Add the getBaseUrl helper to dynamically compute the base URL
function getBaseUrl(request: NextRequest, isPWA: boolean): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (process.env.NODE_ENV === 'production' || isPWA) {
    return 'https://wayofglory.com';
  }
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  return `${protocol}://${host}`;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const orderId = request.nextUrl.pathname.split('/')[4];
  
  // Enhanced PWA detection
  const isPWA = request.headers.get('x-pwa-request') === 'true' || 
                request.headers.get('display-mode') === 'standalone' ||
                request.headers.get('sec-fetch-dest') === 'serviceworker' ||
                process.env.NEXT_PUBLIC_PWA === 'true';
  
  try {
    // Use absolute URLs for logos
    const baseUrl = getBaseUrl(request, isPWA);
    const logoLightUrl = 'https://wayofglory.com/images/logo/LogoLight.png';
    const logoNormalUrl = 'https://wayofglory.com/images/logo/logo.png';

    if (!orderId) {
      console.error('Missing orderId in URL');
      return NextResponse.json({ 
        error: 'Order ID is required',
        success: false,
        isPWA
      }, { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
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

    // Process order items with proper price formatting
    const orderItems = orderData.order_items?.map((item: OrderItem) => {
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
    const subtotal = orderItems.reduce((sum: number, item: { price: string }) => 
      sum + toNumber(item.price), 0);
    const taxAmount = toNumber(orderData.tax_amount);
    const installationPrice = toNumber(orderData.installation_price);
    const totalAmount = subtotal + taxAmount + installationPrice;

    // Format the order data
    const order: Order = {
      id: orderData.id,
      first_name: orderData.first_name,
      last_name: orderData.last_name,
      email: orderData.email,
      total_amount: formatPrice(totalAmount),
      tax_amount: formatPrice(taxAmount),
      created_at: orderData.created_at,
      status: orderData.status,
      order_items: orderItems,
      installation_price: formatPrice(installationPrice),
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
          totalAmount: formatPrice(totalAmount),
          createdAt: order.created_at,
          status: order.status,
          order_items: orderItems,
          subtotal: formatPrice(subtotal),
          tax_amount: formatPrice(taxAmount),
          installation_price: formatPrice(installationPrice),
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
        logoUrl: logoLightUrl,
        logoNormalUrl: logoNormalUrl,
        order_items: orderItems,
        subtotal: formatPrice(subtotal),
        tax_amount: formatPrice(taxAmount),
        installation_price: formatPrice(installationPrice),
        totalAmount: formatPrice(totalAmount)
      };
      prompt = template.prompt;
    }

    // Generate content using the generate-email endpoint
    const generateUrl = isPWA ? 
      'https://wayofglory.com/api/admin/generate-email' : 
      new URL('/api/admin/generate-email', baseUrl).toString();
    
    console.log('Generating email with:', {
      templateId,
      prompt: prompt.substring(0, 100) + '...',
      variables: template.variables,
      isPWA,
      logoUrls: {
        light: logoLightUrl,
        normal: logoNormalUrl
      }
    });

    const generatePayload = {
      prompt: prompt,
      content: prompt,
      variables: {
        ...template.variables,
        logoUrl: logoNormalUrl,
        logoNormalUrl: logoNormalUrl,
        logoLightUrl: logoLightUrl,
        baseUrl: 'https://wayofglory.com',
        isPWA: true
      },
      orderId: orderId_int,
      isPWA: true
    };

    let generateResult;
    try {
      const response = await safeFetch(generateUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'x-pwa-request': 'true',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        body: JSON.stringify(generatePayload)
      });
      generateResult = response;
    } catch (err) {
      console.error('Error calling generate-email:', err);
      return NextResponse.json({ 
        error: 'Failed to generate email content',
        details: err instanceof Error ? err.message : 'Unknown error',
        success: false,
        isPWA
      }, { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }

    if (!generateResult.ok) {
      console.error('Failed to generate email:', {
        status: generateResult.status,
        error: generateResult.data?.error,
        details: generateResult.data?.details
      });
      return NextResponse.json({
        error: 'Failed to generate email',
        details: generateResult.data?.error || generateResult.data?.details || 'Email generation failed',
        success: false,
        isPWA
      }, {
        status: generateResult.status || 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }

    // Log the response for debugging
    console.log('Response status:', generateResult.status);
    console.log('Response text:', JSON.stringify(generateResult.data).substring(0, 200));
    console.log('Clean response text:', JSON.stringify(generateResult.data).substring(0, 200));

    if (!generateResult.data?.html) {
      console.error('Invalid generator response:', generateResult.data);
      return new NextResponse(JSON.stringify({
        error: 'Invalid response from email generator',
        details: 'Missing required HTML in response',
        success: false,
        isPWA,
        content: null,
        html: null
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }

    // Return the generated content directly
    return new NextResponse(JSON.stringify({
      subject: template.subject,
      content: generateResult.data.content || '',
      html: generateResult.data.html,
      success: true,
      isPWA
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    console.error('Error in preview-template:', error);
    return NextResponse.json({ 
      error: 'Failed to generate email preview',
      details: error instanceof Error ? error.message : 'An unexpected error occurred',
      success: false,
      isPWA
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }
}