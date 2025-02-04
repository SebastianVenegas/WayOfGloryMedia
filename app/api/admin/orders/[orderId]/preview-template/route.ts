import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getEmailTemplate, formatEmailPreview } from '@/lib/email-templates';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

interface Order {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  total_amount: Decimal;
  installation_date?: string | null;
  installation_time?: string | null;
  installation_address?: string | null;
  installation_city?: string | null;
  installation_state?: string | null;
  installation_zip?: string | null;
  shipping_address?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_zip?: string | null;
  created_at?: Date;
  updated_at?: Date;
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

    // Fetch order details
    const order = await prisma.order.findUnique({
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
        created_at: true,
        updated_at: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Convert Prisma Decimal to proper type
    const orderWithSerializedAmount = {
      ...order,
      total_amount: order.total_amount as unknown as Decimal,
    }

    // Get email template
    const template = getEmailTemplate(templateId, orderWithSerializedAmount);

    if (!template) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }

    const html = await formatEmailPreview(template.html, orderWithSerializedAmount);

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