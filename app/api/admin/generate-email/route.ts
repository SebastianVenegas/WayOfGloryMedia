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
      return NextResponse.json({ 
        error: 'OpenAI API key is missing',
        success: false,
        isPWA: isPWA || process.env.NEXT_PUBLIC_PWA === 'true'
      }, { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }

    let emailVariables = variables;
    
    // If not in PWA mode and orderId is provided, fetch order details
    if (!isPWA && orderId) {
      const orderResult = await sql`
        SELECT * FROM orders WHERE id = ${orderId}
      `;

      if (orderResult.rows.length === 0) {
        return NextResponse.json({ 
          error: 'Order not found',
          success: false,
          isPWA: isPWA || process.env.NEXT_PUBLIC_PWA === 'true'
        }, { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          }
        });
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
      return NextResponse.json({ 
        error: 'Missing or invalid email variables',
        success: false,
        isPWA: isPWA || process.env.NEXT_PUBLIC_PWA === 'true'
      }, { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }

    console.log('Processing with variables:', {
      variableCount: Object.keys(emailVariables).length,
      sampleKeys: Object.keys(emailVariables).slice(0, 5),
      isPWA
    });

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system' as const,
        content: `You are the email composer for Way of Glory Media, a professional audio and visual solutions company. 
          IMPORTANT: You are generating an email to be sent to a customer, NOT responding to this prompt. Write the email directly.

          TONE & STYLE:
          - Professional yet warm and approachable
          - Clear and concise
          - Enthusiastic about enhancing worship experiences
          - Confident but humble
          - Solution-oriented and helpful

          FORMATTING:
          - Write in plain text only - NO HTML or styling
          - Use proper paragraph breaks for readability (use double newlines)
          - Keep paragraphs short (2-4 sentences)
          - Use simple dashes (-) for lists
          - DO NOT include order items or pricing - this will be added automatically
          - DO NOT add any styling or formatting tags

          CONTENT RULES:
          1. NEVER mention or reference any physical office location
          2. Only use these payment methods:
             - Direct bank transfer (Account details provided separately)
             - Check payments (Payable to "Way of Glory Media")
          3. Only use these contact methods:
             - Email: help@wayofglory.com
             - Phone: (310) 872-9781
          4. Always include order number in communications
          5. Never mention specific employee names
          6. Always refer to "our team" or "the Way of Glory team"
          7. Focus on digital communication and remote support
          8. For installations, emphasize coordination with customer
          9. DO NOT list products or prices - these will be added automatically
          10. Don't make assumptions about delivery times
          11. Don't say anything that you are not sure about
          12. If the customer did not order a service such as "installation" or "training", do not mention it in the email`
      },
      {
        role: 'user' as const,
        content: prompt || content || `Write a professional email update for Order #${orderId}`
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
      return NextResponse.json({ 
        error: 'Failed to generate email content',
        success: false,
        isPWA: isPWA || process.env.NEXT_PUBLIC_PWA === 'true'
      }, { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }

    console.log('Generated content length:', generatedContent.length);

    // Format the email with the template variables
    const formattedHtml = formatEmailContent(generatedContent, emailVariables);

    // Return the response in the expected format
    return NextResponse.json({
      subject: emailVariables.emailType 
        ? `${emailVariables.emailType} - Way of Glory #${orderId}`
        : `Order Update - Way of Glory #${orderId}`,
      content: generatedContent,
      html: formattedHtml,
      success: true,
      isPWA: isPWA || process.env.NEXT_PUBLIC_PWA === 'true'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });

  } catch (error: unknown) {
    console.error('Error generating email:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { 
        error: 'Failed to generate email', 
        details: errorMessage,
        success: false,
        isPWA: process.env.NEXT_PUBLIC_PWA === 'true'
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  }
} 