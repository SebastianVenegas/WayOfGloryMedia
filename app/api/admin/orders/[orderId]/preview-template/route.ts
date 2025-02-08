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
  request: NextRequest,
  context: any
): Promise<NextResponse> {
  try {
    const { orderId } = context.params;
    const templateId = request.nextUrl.searchParams.get('templateId');

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

    try {
      // Get email template
      const template = getEmailTemplate(templateId, order);

      if (!template || !template.html) {
        return NextResponse.json({ error: "Invalid template or empty HTML content" }, { status: 400 });
      }

      // Ensure we're returning a properly structured JSON response
      return NextResponse.json({
        subject: template.subject || `Order #${order.id} - Way of Glory Media`,
        content: template.html,
        html: template.html
      });
    } catch (templateError) {
      console.error('Error generating template:', templateError);
      return NextResponse.json(
        { error: 'Failed to generate email template', details: templateError instanceof Error ? templateError.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating email preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate email preview', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}