import { NextResponse } from 'next/server';
import { getEmailTemplate } from '@/lib/email-templates';
import { sql } from '@vercel/postgres';
import { Order } from '@/lib/email-templates';

interface OrderItem {
  quantity: number;
  price_at_time: number;
  title?: string;
  pricePerUnit?: number;
  product?: {
    title?: string;
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

export async function POST(
  request: Request,
  context: { params: { orderId: string } }
) {
  try {
    console.log('Starting send-template process...');
    const { templateId, customEmail, customPrompt } = await request.json();
    const orderId = parseInt(context.params.orderId);

    console.log('Request details:', {
      templateId,
      hasCustomEmail: !!customEmail,
      hasCustomPrompt: !!customPrompt,
      orderId
    });

    // Get order details
    const { rows: [orderData] } = await sql`
      SELECT o.*,
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
      GROUP BY o.id
    `;

    if (!orderData) {
      console.error('Order not found:', orderId);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log('Found order:', {
      id: orderData.id,
      email: orderData.email,
      name: `${orderData.first_name} ${orderData.last_name}`,
      items: orderData.order_items
    });

    // Cast the database result to Order type
    const order: Order = {
      id: orderData.id,
      first_name: orderData.first_name,
      last_name: orderData.last_name,
      email: orderData.email,
      total_amount: orderData.total_amount,
      tax_amount: orderData.tax_amount,
      created_at: orderData.created_at,
      status: orderData.status,
      order_items: orderData.order_items,
      installation_price: orderData.installation_price,
      installation_date: orderData.installation_date
    };

    let emailContent;
    let subject;
    
    // Calculate order items and totals
    const orderItems = order.order_items?.map((item: OrderItem) => ({
      title: item.product?.title || 'Product',
      quantity: Number(item.quantity),
      price: Number(item.price_at_time) * Number(item.quantity),
      pricePerUnit: Number(item.price_at_time),
      product: item.product
    })) || [];

    const subtotal = orderItems.reduce((sum, item) => sum + item.price, 0);
    const taxAmount = Number(orderData.tax_amount || 0);
    const installationPrice = Number(orderData.installation_price || 0);
    const totalAmount = subtotal + taxAmount + installationPrice;

    const baseVariables = {
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
      logoUrl: '/images/logo/LogoLight.png',
      year: new Date().getFullYear()
    };

    if (customEmail?.html) {
      console.log('Using custom email content');
      emailContent = formatEmailContent(customEmail.html, baseVariables);
      subject = customEmail.subject;
    } else {
      console.log('Generating email content from template');
      const template = getEmailTemplate(templateId, order);
      const prompt = customPrompt || template.prompt;
      
      const generateUrl = new URL('/api/admin/generate-email', process.env.NEXT_PUBLIC_BASE_URL).toString();
      console.log('Sending request to generate-email:', generateUrl);
      
      const response = await fetch(generateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: prompt,
          variables: {
            ...template.variables,
            order_items: orderItems,
            subtotal: subtotal,
            tax_amount: taxAmount,
            installation_price: installationPrice,
            totalAmount: totalAmount
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Generate email failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Failed to generate email content: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      emailContent = formatEmailContent(data.content, {
        ...template.variables,
        emailType: template.variables.emailType || 'Order Update'
      });
      subject = template.subject;
    }

    // Validate email content
    if (!emailContent) {
      console.error('Missing email content');
      throw new Error('Email content is empty');
    }

    // Send email using the send-email endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const sendUrl = new URL('/api/admin/send-email', baseUrl).toString();
    
    const sendResponse = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: order.email,
        subject: subject,
        emailContent: emailContent
      })
    });

    const sendResult = await sendResponse.json();

    if (!sendResponse.ok) {
      console.error('Send email failed:', {
        status: sendResponse.status,
        statusText: sendResponse.statusText,
        error: sendResult
      });
      throw new Error(`Failed to send email: ${sendResult.error || sendResponse.statusText}`);
    }

    console.log('Email sent successfully:', sendResult);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in send-template:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 