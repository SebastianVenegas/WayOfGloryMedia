import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getEmailTemplate, type Order } from '@/lib/email-templates';

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

const formatEmailContent = (content: string, variables: Record<string, any>) => {
  // Split content into paragraphs and wrap them in styled divs
  const formattedContent = content
    .split('\n')
    .filter(paragraph => paragraph.trim() !== '')
    .map(paragraph => `<div style="margin-bottom: 16px; color: #334155; line-height: 1.6;">${paragraph}</div>`)
    .join('');

  // Get the base URL from environment or default to localhost
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const logoFullUrl = `${baseUrl}${variables.logoUrl}`;

  // Calculate subtotal from order items if not provided
  const subtotal = variables.subtotal ?? (variables.order_items?.reduce((sum: number, item: OrderItem) => {
    const price = Number(item.price_at_time || item.pricePerUnit || 0);
    const quantity = Number(item.quantity || 0);
    return sum + (price * quantity);
  }, 0) || 0);

  // Calculate tax amount if not provided
  const taxAmount = Number(variables.tax_amount || 0);

  // Calculate installation price if not provided
  const installationPrice = Number(variables.installation_price || 0);

  // Calculate total amount
  const totalAmount = subtotal + taxAmount + installationPrice;

  // Format order items section
  const orderItemsHtml = variables.order_items?.length ? `
    <div style="margin-bottom: 32px;">
      <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 600;">Order Details</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <tr style="background-color: #f8fafc;">
          <th style="text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; color: #0f172a; font-size: 14px;">Item</th>
          <th style="text-align: center; padding: 12px; border-bottom: 2px solid #e2e8f0; color: #0f172a; font-size: 14px;">Quantity</th>
          <th style="text-align: right; padding: 12px; border-bottom: 2px solid #e2e8f0; color: #0f172a; font-size: 14px;">Price</th>
        </tr>
        ${variables.order_items.map((item: OrderItem) => {
          const title = item.product?.title || item.title || 'Product';
          const quantity = Number(item.quantity);
          const pricePerUnit = Number(item.price_at_time || item.pricePerUnit);
          const totalPrice = pricePerUnit * quantity;
          
          return `
            <tr>
              <td style="text-align: left; padding: 16px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">
                <div style="font-weight: 500;">${title}</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">$${pricePerUnit.toFixed(2)} each</div>
              </td>
              <td style="text-align: center; padding: 16px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">${quantity}</td>
              <td style="text-align: right; padding: 16px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">$${totalPrice.toFixed(2)}</td>
            </tr>
          `;
        }).join('')}
        
        <!-- Installation Service -->
        ${installationPrice > 0 ? `
        <tr>
          <td style="text-align: left; padding: 16px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">
            <div style="font-weight: 500;">Professional Installation Service</div>
          </td>
          <td style="text-align: center; padding: 16px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">1</td>
          <td style="text-align: right; padding: 16px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">$${installationPrice.toFixed(2)}</td>
        </tr>
        ` : ''}

        <!-- Subtotal -->
        <tr>
          <td colspan="2" style="text-align: right; padding: 16px 12px; font-weight: 600; color: #0f172a;">Products Subtotal:</td>
          <td style="text-align: right; padding: 16px 12px; color: #0f172a;">$${subtotal.toFixed(2)}</td>
        </tr>

        <!-- Tax -->
        ${taxAmount > 0 ? `
        <tr>
          <td colspan="2" style="text-align: right; padding: 16px 12px; font-weight: 600; color: #0f172a;">Tax:</td>
          <td style="text-align: right; padding: 16px 12px; color: #0f172a;">$${taxAmount.toFixed(2)}</td>
        </tr>
        ` : ''}

        <!-- Total -->
        <tr>
          <td colspan="2" style="text-align: right; padding: 16px 12px; font-weight: 600; color: #0f172a; font-size: 18px;">Total:</td>
          <td style="text-align: right; padding: 16px 12px; color: #2563eb; font-weight: 600; font-size: 18px;">$${totalAmount.toFixed(2)}</td>
        </tr>
      </table>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${variables.companyName} - Order Update</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; line-height: 1.6; background-color: #f8fafc;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <!-- Container -->
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #0f172a; padding: 32px 24px; text-align: center;">
                    <img src="${logoFullUrl}" alt="${variables.companyName}" style="height: 40px; margin-bottom: 24px;" />
                    <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0 0 8px 0;">${variables.emailType || 'Order Update'}</h1>
                    <p style="color: #e2e8f0; margin: 0; font-size: 16px;">Order #${variables.orderId}</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 32px 24px;">
                    ${formattedContent}
                    ${orderItemsHtml}
                  </td>
                </tr>

                <!-- Call to Action -->
                <tr>
                  <td style="padding: 0 24px 32px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color: #f8fafc; padding: 24px; border-radius: 8px; text-align: center;">
                          <p style="margin: 0 0 16px 0; color: #334155;">Need assistance with your order?</p>
                          <a href="mailto:${variables.supportEmail}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;">Contact Support</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 32px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <img src="${logoFullUrl}" alt="${variables.companyName}" style="height: 32px; margin-bottom: 24px;" />
                    <p style="color: #94a3b8; font-size: 14px; margin: 0 0 8px 0;">${variables.companyName}, Inc.</p>
                    <p style="color: #94a3b8; font-size: 14px; margin: 0;">© ${variables.year || new Date().getFullYear()} ${variables.companyName}. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

type RouteContext = {
  params: {
    orderId: string;
  };
};

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    // Get orderId from params and validate it
    const { orderId } = context.params;
    if (!orderId) {
      console.error('Missing orderId in params');
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const orderId_int = parseInt(orderId);
    if (isNaN(orderId_int)) {
      console.error('Invalid orderId format:', orderId);
      return NextResponse.json({ error: 'Invalid Order ID' }, { status: 400 });
    }

    const templateId = request.nextUrl.searchParams.get('templateId');

    console.log('Preview template request:', {
      orderId: orderId_int,
      templateId,
    });

    if (!templateId) {
      console.error('Missing templateId in query params');
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Fetch order details
    const result = await sql`
      SELECT 
        o.*,
        COALESCE(json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'quantity', oi.quantity,
            'price_at_time', oi.price_at_time,
            'title', p.title,
            'product', json_build_object(
              'title', p.title,
              'category', p.category,
              'description', p.description
            )
          ) ORDER BY oi.id
        ) FILTER (WHERE oi.id IS NOT NULL AND oi.quantity > 0), '[]') as order_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = ${orderId_int}
      GROUP BY o.id;
    `.catch(error => {
      console.error('Database query error:', {
        error,
        message: error.message,
        code: error.code
      });
      throw new Error(`Database error: ${error.message}`);
    });

    if (result.rows.length === 0) {
      console.error('Order not found:', orderId_int);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = result.rows[0] as Order;
    
    console.log('Found order:', {
      id: order.id,
      status: order.status,
      items: order.order_items?.length || 0,
      hasInstallation: !!order.installation_date,
      totalAmount: order.total_amount
    });

    // Calculate order totals
    const subtotal = order.order_items?.reduce((sum, item) => {
      const price = Number(item.price_at_time || 0);
      const quantity = Number(item.quantity || 0);
      return sum + (price * quantity);
    }, 0) || 0;

    const taxAmount = Number(order.tax_amount || 0);
    const installationPrice = Number(order.installation_price || 0);
    const totalAmount = subtotal + taxAmount + installationPrice;

    // Get the template with all necessary variables
    const template = getEmailTemplate(templateId, {
      ...order,
      subtotal,
      tax_amount: taxAmount,
      installation_price: installationPrice,
      total_amount: totalAmount,
      order_items: order.order_items || []
    });
    
    if (!template) {
      console.error('Template not found:', templateId);
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }

    if (!template.prompt) {
      console.error('Template missing prompt:', templateId);
      return NextResponse.json({ error: "Template missing prompt content" }, { status: 400 });
    }

    // Generate content using the generate-email endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const generateUrl = new URL('/api/admin/generate-email', baseUrl).toString();
    
    console.log('Generating email with:', {
      templateId,
      prompt: template.prompt.substring(0, 100) + '...',
      variables: template.variables
    });

    const generateResponse = await fetch(generateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt: template.prompt,
        variables: template.variables
      })
    }).catch(error => {
      console.error('Generate email request failed:', {
        error,
        message: error.message
      });
      throw new Error(`Failed to send generate email request: ${error.message}`);
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

    const data = await generateResponse.json().catch(error => {
      console.error('Failed to parse generate email response:', {
        error,
        message: error.message
      });
      throw new Error('Invalid response from generate-email endpoint');
    });
    
    if (!data.html || !data.content) {
      console.error('Invalid response from generate-email:', data);
      return NextResponse.json({ 
        error: 'Generate email returned invalid content',
        details: 'Missing html or content in response'
      }, { status: 500 });
    }

    // Return the response with proper data
    return NextResponse.json({
      subject: template.subject || `Order #${order.id} - Way of Glory Media`,
      content: data.content,
      html: data.html
    });

  } catch (error) {
    console.error('Error in preview-template:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Failed to generate email preview',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}