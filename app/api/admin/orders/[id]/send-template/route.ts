import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { Resend } from 'resend';
import { getEmailTemplate } from '@/lib/email-templates';

interface Order {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  total_amount: number | string;
  installation_date?: string;
  installation_time?: string;
  installation_address?: string;
  installation_city?: string;
  installation_state?: string;
  installation_zip?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;
  order_items?: Array<{
    id: number;
    product_id: number;
    quantity: number;
    price_at_time: number;
    cost_at_time: number;
    product: {
      title: string;
    };
  }>;
}

interface CustomEmail {
  subject: string;
  content: string;
}

interface SendTemplateRequest {
  templateId: string;
  customEmail?: CustomEmail;
}

const resend = new Resend(process.env.RESEND_API_KEY);

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { templateId, customEmail } = await request.json() as SendTemplateRequest;
    const orderId = context.params.id;

    // Fetch order details
    const { rows } = await sql`
      SELECT 
        orders.*,
        json_agg(json_build_object(
          'id', order_items.id,
          'product_id', order_items.product_id,
          'quantity', order_items.quantity,
          'price_at_time', order_items.price_at_time,
          'cost_at_time', order_items.cost_at_time,
          'product', json_build_object(
            'title', products.title
          )
        )) as order_items
      FROM orders
      LEFT JOIN order_items ON orders.id = order_items.order_id
      LEFT JOIN products ON order_items.product_id = products.id
      WHERE orders.id = ${orderId}
      GROUP BY orders.id
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = rows[0];
    
    // Cast the database result to Order type
    const order: Order = {
      id: orderData.id,
      first_name: orderData.first_name,
      last_name: orderData.last_name,
      email: orderData.email,
      total_amount: orderData.total_amount,
      installation_date: orderData.installation_date,
      installation_time: orderData.installation_time,
      installation_address: orderData.installation_address,
      installation_city: orderData.installation_city,
      installation_state: orderData.installation_state,
      installation_zip: orderData.installation_zip,
      shipping_address: orderData.shipping_address,
      shipping_city: orderData.shipping_city,
      shipping_state: orderData.shipping_state,
      shipping_zip: orderData.shipping_zip,
      order_items: orderData.order_items,
    };

    // Get email template
    const template = getEmailTemplate(templateId, order);

    if (!template) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    // Ensure we have a valid RESEND_API_KEY
    if (!process.env.RESEND_API_KEY) {
      throw new Error('Missing RESEND_API_KEY');
    }

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: 'Way of Glory <orders@wayofglory.com>',
      to: order.email,
      subject: customEmail?.subject || template.subject,
      html: customEmail?.content || template.html,
      text: (customEmail?.content || template.html).replace(/<[^>]*>/g, ''),
    });

    if (!emailResponse.data?.id) {
      console.error('Resend API Error:', emailResponse);
      throw new Error('Failed to send email via Resend');
    }

    // Update order status
    await sql`
      UPDATE orders 
      SET updated_at = NOW()
      WHERE id = ${orderId}
    `;

    return NextResponse.json({ 
      success: true,
      message: 'Email sent successfully',
      emailId: emailResponse.data.id
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
} 