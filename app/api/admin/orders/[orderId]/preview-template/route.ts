import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getEmailTemplate, formatEmailPreview } from '@/lib/email-templates';

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
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const orderId = Number(url.pathname.split('/').slice(-2, -1)[0]); // Extract `[id]` from URL path

    if (!orderId || isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const { templateId } = await request.json();

    if (!templateId) {
      return NextResponse.json({ error: "Missing template ID" }, { status: 400 });
    }

    // Get the order details from the database
    const { rows: [orderData] } = await sql`
      SELECT * FROM orders WHERE id = ${orderId}
    `;

    if (!orderData) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

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