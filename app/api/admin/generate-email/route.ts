import { NextResponse } from 'next/server'
import { Configuration, OpenAIApi } from 'openai'
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

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export async function POST(request: NextRequest) {
  try {
    // Check if this is a PWA request
    const isPWA = request.headers.get('x-pwa-request') === 'true';
    
    // Set cache control headers
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };

    const { prompt, variables } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400, headers }
      );
    }

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional email composer. Create HTML emails that are well-formatted and responsive."
        },
        {
          role: "user",
          content: `${prompt}\n\nVariables:\n${JSON.stringify(variables, null, 2)}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = completion.data.choices[0].message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'No content generated' },
        { status: 500, headers }
      );
    }

    // For PWA requests, we need to ensure the response is properly formatted
    const formattedContent = isPWA ? 
      content.replace(/\n/g, '<br>') : 
      content;

    return NextResponse.json(
      { 
        content: formattedContent,
        html: formattedContent 
      },
      { headers }
    );

  } catch (error: any) {
    console.error('Email generation error:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate email',
        details: error.response?.data || error.toString()
      },
      { 
        status: error.status || 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  }
}

export const dynamic = 'force-dynamic'; 