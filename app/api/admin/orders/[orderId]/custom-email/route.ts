import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import OpenAI from 'openai';
import { formatEmailContent } from '@/lib/email-templates';

const AI_EMAIL_CONFIG = {
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
  12. If the customer did not order a service such as "installation" or "training", do not mention it in the email

  STRUCTURE:
  1. Opening: Warm, personal greeting using first name
  2. Purpose: Clear statement of email's purpose
  3. Details: Relevant information (excluding product details)
  4. Next Steps: Clear action items or expectations
  5. Support: Contact information
  6. Closing: Warm, professional sign-off

  BRANDING:
  - Company Name: Way of Glory Media
  - Mission: Enhancing worship experiences
  - Values: Excellence, Professionalism, Service
  - Voice: Modern, Professional, Ministry-Focused`
};

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

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
): Promise<NextResponse> {
  try {
    const orderIdInt = parseInt(params.orderId);

    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is missing');
      return NextResponse.json({ error: 'Server configuration error', details: 'OpenAI API key is missing' }, { status: 500 });
    }

    // Parse request body
    const body = await request.json().catch((error: any) => {
      console.error('Failed to parse request body:', error);
      return null;
    });

    if (!body) {
      return NextResponse.json({ error: 'Invalid request', details: 'Failed to parse request body' }, { status: 400 });
    }

    const { prompt, variables } = body;

    // Validate required fields
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      console.error('Invalid or missing prompt:', { prompt });
      return NextResponse.json({ error: 'Invalid request', details: 'Prompt is required and must be a non-empty string' }, { status: 400 });
    }

    if (!variables || typeof variables !== 'object') {
      console.error('Missing or invalid variables:', { variables });
      return NextResponse.json({ error: 'Invalid request', details: 'Email variables are required' }, { status: 400 });
    }

    // Log request details
    console.log('Generating custom email with:', {
      orderId: orderIdInt,
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 100) + '...',
      customerName: `${variables.firstName} ${variables.lastName}`,
      hasInstallation: variables.includesInstallation,
      hasTraining: variables.includesTraining,
      variablesProvided: Object.keys(variables)
    });

    // Initialize OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Generate email content
    const completion = await openai.chat.completions.create({
      model: AI_EMAIL_CONFIG.model,
      temperature: AI_EMAIL_CONFIG.temperature,
      max_tokens: AI_EMAIL_CONFIG.max_tokens,
      messages: [
        {
          role: "system",
          content: AI_EMAIL_CONFIG.system_prompt
        },
        {
          role: "user",
          content: `${prompt}\n\nCustomer Details:
          Name: ${variables.firstName} ${variables.lastName}
          Order: #${variables.orderId}
          ${variables.includesInstallation ? `Installation Date: ${variables.installationDate}\nInstallation Time: ${variables.installationTime}\n` : ''}Status: ${variables.status}
          Includes Installation: ${variables.includesInstallation ? 'Yes' : 'No'}
          Includes Training: ${variables.includesTraining ? 'Yes' : 'No'}`
        }
      ]
    }).catch(error => {
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.message}`);
    });

    const emailContent = completion.choices[0]?.message?.content;
    
    // Validate OpenAI response
    if (!emailContent || typeof emailContent !== 'string') {
      console.error('OpenAI returned invalid content:', { emailContent });
      return NextResponse.json(
        { error: 'Generation failed', details: 'Invalid or empty content returned from AI' },
        { status: 500 }
      );
    }

    // Process the content
    let subject = `Order Update - Way of Glory #${orderIdInt}`;
    let content = emailContent.trim();

    // Extract subject if present
    const subjectMatch = content.match(/^(?:subject:|re:|regarding:)\s*(.+?)(?:\n|$)/i);
    if (subjectMatch) {
      subject = subjectMatch[1].trim();
      content = content.replace(/^(?:subject:|re:|regarding:)\s*.+?\n/, '').trim();
    }

    // Validate processed content
    if (!content) {
      console.error('Empty content after processing');
      return NextResponse.json(
        { error: 'Processing failed', details: 'Email content is empty after processing' },
        { status: 500 }
      );
    }

    // Format the content
    const formattedContent = formatEmailContent(content, {
      ...variables,
      orderId: variables.orderId,
      firstName: variables.firstName,
      lastName: variables.lastName,
      emailType: subject.replace(' - Way of Glory', '').replace(` #${variables.orderId}`, ''),
      companyName: 'Way of Glory Media',
      supportEmail: 'help@wayofglory.com',
      logoUrl: '/images/logo/LogoLight.png'
    });

    // Log success
    console.log('Successfully generated email:', {
      subjectLength: subject.length,
      contentLength: content.length,
      formattedContentLength: formattedContent.length
    });

    // Return the response
    return NextResponse.json({
      subject,
      content,
      html: formattedContent
    });

  } catch (error) {
    console.error('Error in custom-email:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { 
        error: 'Email generation failed',
        details: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
} 