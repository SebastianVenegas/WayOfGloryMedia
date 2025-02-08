import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getEmailTemplate, type Order } from '@/lib/email-templates';

interface OrderItem {
  quantity: number;
  price_at_time: number;
  product?: {
    title?: string;
  };
}

export async function GET(
  request: Request | NextRequest,
  context: { params: { orderId: string } }
): Promise<Response | NextResponse> {
  try {
    const { orderId } = context.params;
    const url = new URL(request.url);
    const templateId = url.searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Fetch order details
    const result = await sql`
      SELECT o.*, 
        json_agg(json_build_object(
          'id', oi.id,
          'product_id', oi.product_id,
          'quantity', oi.quantity,
          'price_at_time', oi.price_at_time,
          'product', json_build_object(
            'title', p.title,
            'category', p.category
          )
        )) as order_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = ${orderId}
      GROUP BY o.id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = result.rows[0] as Order;

    // Get email template
    const template = getEmailTemplate(templateId, order);

    if (!template) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error generating email preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate email preview' },
      { status: 500 }
    );
  }
}