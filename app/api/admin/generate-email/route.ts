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
      return new NextResponse(JSON.stringify({ 
        error: 'Prompt is required',
        success: false,
        isPWA,
        content: null,
        html: null
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }

    // After reading the request body, add default AI config if none is provided
    const defaultAIConfig = {
      model: "gpt-4",
      temperature: 0.7,
      max_tokens: 2000,
      system_prompt: `You are the email composer for Way of Glory Media, a professional audio and visual solutions company. 
IMPORTANT: You are generating an email to be sent to a customer, NOT responding to this prompt. Write the email directly.

TONE & STYLE:
- Professional yet warm and approachable
- Clear and concise
- Enthusiastic about enhancing worship experiences
- Confident but humble
- Solution-oriented and helpful

FORMATTING:
- Use proper paragraph breaks for readability
- Keep paragraphs short (2-4 sentences)
- Use bullet points for lists or steps
- Include clear section breaks

CONTENT RULES:
1. NEVER mention or reference any physical office location
2. Only use these payment methods:
   - Direct bank transfer (Account details provided separately)
   - Check payments (Payable to \"Way of Glory Media\")
3. Only use these contact methods:
   - Email: help@wayofglory.com
   - Phone: (310) 872-9781
4. Always include order number in communications
5. Never mention specific employee names
6. Always refer to \"our team\" or \"the Way of Glory team\"
7. Focus on digital communication and remote support
8. For installations, emphasize coordination with customer
9. Use accurate pricing from provided variables
10. Don't make assumptions about delivery times
11. Don't say anything that you are not sure about
12. if the customer did not order a service such as \"installation\" or \"training\", do not mention it in the email.

STRUCTURE:
1. Opening: Warm, personal greeting using first name
2. Purpose: Clear statement of email's purpose
3. Details: Relevant information, clearly organized
4. Next Steps: Clear action items or expectations
5. Support: Contact information
6. Closing: Warm, professional sign-off

BRANDING:
- Company Name: Way of Glory Media
- Mission: Enhancing worship experiences
- Values: Excellence, Professionalism, Service
- Voice: Modern, Professional, Ministry-Focused`
    };

    const finalVariables = variables ? { ...defaultAIConfig, ...variables } : defaultAIConfig;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: finalVariables.system_prompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: finalVariables.temperature,
        max_tokens: finalVariables.max_tokens
      });

      const content = completion.choices[0]?.message?.content;

      if (!content) {
        console.error('No content generated from OpenAI');
        return new NextResponse(JSON.stringify({
          error: 'No content generated',
          success: false,
          isPWA,
          content: null,
          html: null
        }), { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        });
      }

      // Update logo URLs based on PWA status
      const baseUrl = 'https://wayofglory.com';
      
      // Ensure logo URLs are always absolute
      const logoLight = 'https://wayofglory.com/images/logo/LogoLight.png';
      const logoNormal = 'https://wayofglory.com/images/logo/logo.png';

      // Use finalVariables in formattedVariables
      const formattedVariables = {
        ...finalVariables,
        logoUrl: logoNormal,
        logoNormalUrl: logoNormal,
        logoLightUrl: logoLight,
        baseUrl,
        companyName: 'Way of Glory Media',
        supportEmail: 'help@wayofglory.com',
        websiteUrl: 'https://wayofglory.com',
        isPWA: true
      };

      // Format the content with proper styling
      const formattedHtml = formatEmailContent(content, formattedVariables);

      // Return both the raw content and formatted HTML
      return new NextResponse(JSON.stringify({
        content,
        html: formattedHtml,
        success: true,
        isPWA: true,
        message: 'Email content generated successfully'
      }), { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });

    } catch (error: any) {
      console.error('OpenAI API Error:', {
        error: error.message,
        stack: error.stack,
        details: error.response?.data || error.data || error
      });
      
      return new NextResponse(JSON.stringify({
        error: 'Failed to generate email content',
        details: error.message || 'An error occurred during email generation',
        success: false,
        isPWA,
        content: null,
        html: null,
        errorData: {
          message: error.message,
          type: error.type || error.name,
          status: error.status || 500,
          details: error.response?.data || error.data || null
        }
      }), { 
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
    
    return new NextResponse(JSON.stringify({
      error: 'Failed to process request',
      details: error.message || 'Invalid request format',
      success: false,
      isPWA: false,
      content: null,
      html: null,
      errorData: {
        message: error.message,
        type: error.type || error.name,
        status: error.status || 400,
        details: error.response?.data || error.data || null
      }
    }), { 
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }
} 