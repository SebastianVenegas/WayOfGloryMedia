import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { formatEmailContent } from '@/lib/email-templates'
import { sql } from '@vercel/postgres'
import { NextRequest } from 'next/server'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

interface OrderItem {
  title?: string;
  quantity: number;
  price?: number;
  pricePerUnit?: number;
  price_at_time?: number;
  product?: {
    title?: string;
    description?: string;
  };
}

// Add price formatting helper
const formatPrice = (price: number | string | null | undefined): string => {
  if (price === null || price === undefined) return '0.00'
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price
  return isNaN(numericPrice) ? '0.00' : numericPrice.toFixed(2)
}

// Add numeric conversion helper
const toNumber = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) return 0
  const num = typeof value === 'string' ? parseFloat(value) : value
  return isNaN(num) ? 0 : num
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, prompt, variables, content, isPWA } = await request.json();
    
    console.log('Received request:', {
      orderId,
      promptLength: prompt?.length,
      variablesKeys: variables ? Object.keys(variables) : [],
      isPWA,
      contentLength: content?.length
    });

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is missing');
      return NextResponse.json({ error: 'OpenAI API key is missing' }, { status: 500 });
    }

    let emailVariables = variables;
    
    // If not in PWA mode and orderId is provided, fetch order details
    if (!isPWA && orderId) {
      const orderResult = await sql`
        SELECT * FROM orders WHERE id = ${orderId}
      `;

      if (orderResult.rows.length === 0) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      const order = orderResult.rows[0];
      emailVariables = {
        ...variables,
        order_number: order.id,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        church_name: order.church_name,
        church_address: order.church_address,
        order_status: order.status,
        notes: order.notes || '',
      };
    }

    // Ensure all required variables are present
    if (!emailVariables || typeof emailVariables !== 'object') {
      console.error('Missing or invalid email variables');
      return NextResponse.json({ error: 'Missing or invalid email variables' }, { status: 400 });
    }

    console.log('Processing with variables:', {
      variableCount: Object.keys(emailVariables).length,
      sampleKeys: Object.keys(emailVariables).slice(0, 5)
    });

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system' as const,
        content: 'You are a professional email writer. Generate an email based on the provided template and variables.'
      },
      {
        role: 'user' as const,
        content: `${prompt}\n\nVariables:\n${JSON.stringify(emailVariables, null, 2)}`
      }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 1500
    });

    const generatedContent = completion.choices[0]?.message?.content;

    if (!generatedContent) {
      console.error('No content generated from OpenAI');
      return NextResponse.json({ error: 'Failed to generate email content' }, { status: 500 });
    }

    console.log('Generated content length:', generatedContent.length);

    // Format the email with the template variables
    const formattedHtml = formatEmailContent(generatedContent, emailVariables);

    // Return the response in the expected format
    return NextResponse.json({
      subject: `Order Update - Way of Glory #${orderId}`,
      content: generatedContent,
      html: formattedHtml
    });

  } catch (error: unknown) {
    console.error('Error generating email:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { error: 'Failed to generate email', details: errorMessage },
      { status: 500 }
    );
  }
} 