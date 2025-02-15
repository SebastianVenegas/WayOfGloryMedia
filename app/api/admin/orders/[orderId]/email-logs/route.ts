import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function GET(
  request: Request,
  context: { params: { orderId: string } }
): Promise<Response> {
  const { orderId } = context.params;
  const orderIdInt = parseInt(orderId, 10);
  if (isNaN(orderIdInt)) {
    return NextResponse.json({ error: 'Invalid Order ID' }, { status: 400 });
  }
  
  try {
    const result = await sql`
      SELECT 
        el.*, 
        SUBSTRING(el.content, 1, 200) as preview
      FROM email_logs el
      WHERE el.order_id = ${orderIdInt}
      ORDER BY el.sent_at DESC;
    `;
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching email logs:', error);
    return NextResponse.json({ error: 'Failed to fetch email logs' }, { status: 500 });
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */ 