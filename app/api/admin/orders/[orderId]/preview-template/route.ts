import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getEmailTemplate, formatEmailPreview, Order as EmailOrder } from '@/lib/email-templates';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

interface Order extends EmailOrder {}

export async function POST(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { templateId } = await request.json();
    const orderId = parseInt(params.orderId);

    if (!orderId || isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    // Fetch order details
    const orderData = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        total_amount: true,
        installation_date: true,
        installation_time: true,
        installation_address: true,
        installation_city: true,
        installation_state: true,
        installation_zip: true,
        shipping_address: true,
        shipping_city: true,
        shipping_state: true,
        shipping_zip: true,
      },
    });

    if (!orderData) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Convert the order data to match the Order interface
    const order: Order = {
      ...orderData,
      total_amount: orderData.total_amount as unknown as Decimal,
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