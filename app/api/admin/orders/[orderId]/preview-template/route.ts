import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getEmailTemplate, formatEmailPreview, Order as EmailOrder } from '@/lib/email-templates';

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
): Promise<NextResponse> {
  try {
    const { templateId } = await request.json();
    const orderId = parseInt(params.orderId);

    if (!orderId || isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    // Fetch order details using Vercel Postgres
    const { rows } = await sql`
      SELECT 
        id,
        first_name,
        last_name,
        email,
        CAST(total_amount AS FLOAT) as total_amount,
        installation_date,
        installation_time,
        installation_address,
        installation_city,
        installation_state,
        installation_zip,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_zip
      FROM orders 
      WHERE id = ${orderId}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = rows[0];

    // Convert the order data to match the EmailOrder interface
    const order: EmailOrder = {
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
    };

    // Get email template
    const template = getEmailTemplate(templateId, order);

    if (!template) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }

    const html = await formatEmailPreview(template.html, order);

    return NextResponse.json({
      subject: template.subject,
      html: html
    });
  } catch (error) {
    console.error("Error generating template preview:", error);
    return NextResponse.json(
      { error: "Failed to generate template preview" },
      { status: 500 }
    );
  }
}