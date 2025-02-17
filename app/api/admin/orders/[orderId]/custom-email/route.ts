import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getEmailTemplate, formatEmailContent } from '@/lib/email-templates';
import { safeFetch } from '@/lib/safeFetch';

export async function POST(request: NextRequest, context: any) {
  const { params } = context;
  const orderId = params.orderId;
  
  // Enhanced PWA detection
  const isPWA = request.headers.get('x-pwa-request') === 'true' || 
                request.headers.get('display-mode') === 'standalone' ||
                request.headers.get('sec-fetch-dest') === 'serviceworker';

  try {
    const body = await request.json();
    const { customPrompt, prompt } = body;

    if (!customPrompt && !prompt) {
      return new NextResponse(JSON.stringify({
        error: 'Prompt is required',
        success: false,
        isPWA
      }), { status: 400 });
    }

    // Fetch order details
    const result = await sql`
      SELECT o.*,
        COALESCE(json_agg(
          json_build_object(
            'quantity', oi.quantity,
            'price_at_time', oi.price_at_time,
            'product', json_build_object(
              'title', p.title,
              'description', p.description,
              'category', p.category,
              'features', p.features,
              'technical_details', p.technical_details,
              'included_items', p.included_items,
              'warranty_info', p.warranty_info,
              'installation_available', p.installation_available
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
      return new NextResponse(JSON.stringify({
        error: 'Order not found',
        success: false,
        isPWA
      }), { status: 404 });
    }

    const orderData = result.rows[0];
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://wayofglory.com';

    // Calculate order totals
    const orderItems = orderData.order_items.map(item => ({
      title: item.product?.title || 'Product',
      quantity: Number(item.quantity) || 0,
      price: Number(item.price_at_time) * Number(item.quantity),
      pricePerUnit: Number(item.price_at_time),
      product: item.product
    }));

    const subtotal = orderItems.reduce((sum, item) => sum + (item.price || 0), 0);
    const taxAmount = Number(orderData.tax_amount || 0);
    const installationPrice = Number(orderData.installation_price || 0);
    const totalAmount = subtotal + taxAmount + installationPrice;

    // Format the prompt with order details
    const formattedPrompt = `
      ${customPrompt || prompt}

      Order Details:
      - Order Number: #${orderData.id}
      - Customer Name: ${orderData.first_name} ${orderData.last_name}
      - Total Amount: $${totalAmount.toFixed(2)}
      - Order Status: ${orderData.status}
      ${orderData.installation_date ? `- Installation Date: ${new Date(orderData.installation_date).toLocaleDateString()}` : ''}
      
      Order Items:
      ${orderItems.map(item => `- ${item.quantity}x ${item.title} ($${item.price.toFixed(2)})`).join('\n')}
      
      Additional Information:
      - Subtotal: $${subtotal.toFixed(2)}
      - Tax: $${taxAmount.toFixed(2)}
      ${installationPrice > 0 ? `- Installation: $${installationPrice.toFixed(2)}` : ''}
    `.trim();

    // Generate email content
    const generateUrl = `${baseUrl}/api/admin/generate-email`;
    const generateResponse = await safeFetch(generateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-pwa-request': 'true'
      },
      body: JSON.stringify({
        prompt: formattedPrompt,
        variables: {
          orderId: orderData.id,
          firstName: orderData.first_name,
          lastName: orderData.last_name,
          email: orderData.email,
          totalAmount: totalAmount.toFixed(2),
          createdAt: orderData.created_at,
          status: orderData.status,
          order_items: orderItems,
          subtotal: subtotal.toFixed(2),
          tax_amount: taxAmount.toFixed(2),
          installation_price: installationPrice.toFixed(2),
          companyName: 'Way of Glory Media',
          supportEmail: 'help@wayofglory.com',
          websiteUrl: 'https://wayofglory.com',
          logoUrl: `${baseUrl}/images/logo/LogoLight.png`,
          logoLightUrl: `${baseUrl}/images/logo/LogoLight.png`,
          logoNormalUrl: `${baseUrl}/images/logo/logo.png`,
          year: new Date().getFullYear(),
          installationDate: orderData.installation_date ? new Date(orderData.installation_date).toLocaleDateString() : '',
          isPWA
        }
      })
    });

    if (!generateResponse.ok && !generateResponse.data?.html && !generateResponse.data?.content) {
      throw new Error('Failed to generate email content');
    }

    return new NextResponse(JSON.stringify({
      content: generateResponse.data.content,
      html: generateResponse.data.html,
      subject: `Order Update - Way of Glory #${orderData.id}`,
      success: true,
      isPWA
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    console.error('Error in custom-email:', error);
    return new NextResponse(JSON.stringify({
      error: 'Failed to generate custom email',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
      success: false,
      isPWA
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }
} 