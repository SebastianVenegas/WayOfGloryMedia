import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest, { params }: any): Promise<NextResponse> {
  try {
    const orderId = params.orderId;
    const orderIdInt = parseInt(orderId);

    if (isNaN(orderIdInt)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const { rows } = await sql`
      SELECT 
        id,
        subject,
        content,
        sent_at,
        template_id
      FROM email_logs
      WHERE order_id = ${orderIdInt}
      ORDER BY sent_at DESC
    `;

    // Format the rows but preserve the full HTML content
    const formattedLogs = rows.map(row => {
      // Create a preview by removing HTML tags and limiting length
      const previewText = row.content
        .replace(/<[^>]*>/g, ' ')  // Remove HTML tags
        .replace(/\s+/g, ' ')      // Normalize whitespace
        .trim()
        .substring(0, 150) + '...';

      return {
        id: row.id,
        subject: row.subject,
        content: row.content,  // Keep the original HTML content intact
        sent_at: new Date(row.sent_at).toISOString(),
        template_id: row.template_id,
        preview: previewText
      };
    });

    return NextResponse.json(formattedLogs);
  } catch (error) {
    console.error('Error fetching email logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email logs' },
      { status: 500 }
    );
  }
} 