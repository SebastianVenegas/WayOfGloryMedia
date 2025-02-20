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

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const orderId = request.nextUrl.pathname.split('/')[4];
  
  // Enhanced PWA detection
  const isPWA = request.headers.get('x-pwa-request') === 'true' || 
                process.env.NEXT_PUBLIC_PWA === 'true';
  
  // Common response headers
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
    'Access-Control-Allow-Origin': isPWA ? 'https://wayofglory.com' : '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-pwa-request',
    'Access-Control-Allow-Credentials': 'true'
  };

  // Handle OPTIONS request for CORS
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers });
  }

  try {
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { 
        status: 400,
        headers
      });
    }

    const templateId = searchParams.get('templateId');
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { 
        status: 400,
        headers
      });
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
      WHERE o.id = ${parseInt(orderId)}
      GROUP BY o.id;
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { 
        status: 404,
        headers
      });
    }

    const orderData = result.rows[0];
    const orderItems = orderData.order_items?.map((item: any) => ({
      title: item.product?.title || 'Product',
      quantity: toNumber(item.quantity),
      price: formatPrice(toNumber(item.quantity) * toNumber(item.price_at_time)),
      pricePerUnit: formatPrice(item.price_at_time),
      product: item.product
    })) || [];

    const subtotal = orderItems.reduce((sum: number, item: any) => 
      sum + toNumber(item.price), 0);
    const taxAmount = toNumber(orderData.tax_amount);
    const installationPrice = toNumber(orderData.installation_price);
    const totalAmount = subtotal + taxAmount + installationPrice;

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
      installation_date: orderData.installation_date,
      installation_time: orderData.installation_time
    };

    // Get template
    const template = getEmailTemplate(templateId, order);
    if (!template) {
      return NextResponse.json({ error: 'Invalid template ID' }, { 
        status: 400,
        headers
      });
    }

    // Add variables
    template.variables = {
      ...template.variables,
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
      logoUrl: 'https://wayofglory.com/images/logo/LogoLight.png',
      logoNormalUrl: 'https://wayofglory.com/images/logo/logo.png',
      year: new Date().getFullYear(),
      baseUrl: isPWA ? 'https://wayofglory.com' : request.nextUrl.origin
    };

    // Generate content
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const generateResponse = await safeFetch(`${isPWA ? 'https://wayofglory.com' : request.nextUrl.origin}/api/admin/generate-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pwa-request': 'true'
        },
        body: JSON.stringify({
          prompt: template.prompt,
          variables: template.variables,
          orderId: order.id,
          isPWA: true
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!generateResponse.ok) {
        throw new Error(generateResponse.data?.error || 'Failed to generate email content');
      }

      const generateResult = generateResponse.data;

      if (!generateResult.html && !generateResult.content) {
        throw new Error('Invalid template response');
      }

      return NextResponse.json({
        subject: template.subject,
        content: generateResult.content || '',
        html: generateResult.html || '',
        success: true
      }, {
        status: 200,
        headers
      });

    } catch (error) {
      console.error('Error generating email:', error);
      return NextResponse.json({
        error: error instanceof Error ? error.message : 'Failed to generate email content',
        success: false
      }, {
        status: 500,
        headers
      });
    }

  } catch (error) {
    console.error('Error in preview-template:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      success: false
    }, {
      status: 500,
      headers
    });
  }
}