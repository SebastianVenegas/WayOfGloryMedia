import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface EmailLog {
  id: number;
  subject: string | null;
  content: string | null;
  sent_at: Date | null;
  template_id: string | null;
  created_at: Date | null;
}

interface FormattedEmailLog {
  id: number;
  subject: string;
  content: string;
  sent_at: string;
  template_id?: string;
  status: string;
  preview: string;
}

export async function GET(
  request: NextRequest,
  context: { params: { [key: string]: string } }
): Promise<NextResponse> {
  const { params } = context;
  const orderIdNum = parseInt(params.orderId);

  if (isNaN(orderIdNum)) {
    return NextResponse.json(
      { error: 'Invalid order ID format' },
      { status: 400 }
    );
  }

  const emailLogs = await prisma.email_logs.findMany({
    where: {
      order_id: orderIdNum
    },
    orderBy: {
      sent_at: 'desc'
    },
    select: {
      id: true,
      subject: true,
      content: true,
      sent_at: true,
      template_id: true,
      created_at: true
    }
  });

  // Format the logs to match the expected structure
  const formattedLogs: FormattedEmailLog[] = emailLogs.map((log: EmailLog) => ({
    id: log.id,
    subject: log.subject || '',
    content: log.content || '',
    sent_at: log.sent_at?.toISOString() || log.created_at?.toISOString() || new Date().toISOString(),
    template_id: log.template_id || undefined,
    status: 'sent',
    preview: log.content?.substring(0, 150) || ''
  }));

  return NextResponse.json(formattedLogs);
} 