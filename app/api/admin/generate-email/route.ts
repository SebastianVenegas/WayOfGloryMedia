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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, variables, isPWA } = body;

    if (!prompt) {
      return NextResponse.json({ 
        error: 'Prompt is required',
        success: false,
        isPWA 
      }, { status: 400 });
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: variables?.ai_config?.system_prompt || "You are a helpful assistant."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: variables?.ai_config?.temperature || 0.7,
        max_tokens: variables?.ai_config?.max_tokens || 2000,
      });

      const content = completion.choices[0]?.message?.content;

      if (!content) {
        console.error('No content generated from OpenAI');
        return NextResponse.json({
          error: 'No content generated',
          success: false,
          isPWA
        }, { status: 500 });
      }

      // Update logo URLs based on PWA status
      const baseUrl = isPWA ? 'https://wayofglory.com' : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      
      // Ensure logo URLs are always absolute for PWA
      const logoLight = `${baseUrl}/images/logo/LogoLight.png`;
      const logoNormal = `${baseUrl}/images/logo/logo.png`;

      const formattedVariables = {
        ...variables,
        logoUrl: logoNormal,
        logoNormalUrl: logoLight,
        logoLightUrl: logoLight,
        baseUrl,
        companyName: 'Way of Glory Media',
        supportEmail: 'help@wayofglory.com',
        websiteUrl: 'https://wayofglory.com',
        isPWA
      };

      // Format the content with proper styling
      const formattedHtml = formatEmailContent(content, formattedVariables);

      // Return only the formatted HTML with detailed success response
      return NextResponse.json({
        html: formattedHtml,
        success: true,
        isPWA,
        message: 'Email content generated successfully'
      }, { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });

    } catch (error: any) {
      console.error('OpenAI API Error:', {
        error: error.message,
        stack: error.stack,
        details: error.response?.data || error.data || error
      });
      
      // Enhanced error response with more details
      return NextResponse.json({
        error: 'Failed to generate email content',
        details: error.message || 'An error occurred during email generation',
        success: false,
        isPWA,
        errorData: {
          message: error.message,
          type: error.type || error.name,
          status: error.status || 500,
          details: error.response?.data || error.data || null
        }
      }, { 
        status: error.status || 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }
  } catch (error: any) {
    console.error('Request processing error:', {
      error: error.message,
      stack: error.stack,
      details: error.response?.data || error.data || error
    });
    
    // Enhanced error response for request processing errors
    return NextResponse.json({
      error: 'Failed to process request',
      details: error.message || 'Invalid request format',
      success: false,
      isPWA: false,
      errorData: {
        message: error.message,
        type: error.type || error.name,
        status: error.status || 400,
        details: error.response?.data || error.data || null
      }
    }, { 
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }
} 