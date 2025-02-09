import { NextResponse } from 'next/server'
import OpenAI from 'openai'

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

const formatEmailContent = (content: string, variables: Record<string, any>) => {
  // Split content into paragraphs and wrap them in styled divs
  const formattedContent = content
    .split('\n')
    .filter(paragraph => paragraph.trim() !== '')
    .map(paragraph => `<div style="margin-bottom: 16px; color: #334155; line-height: 1.6;">${paragraph}</div>`)
    .join('');

  // Get the base URL from environment or default to localhost
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const logoFullUrl = `${baseUrl}${variables.logoUrl}`;

  // Calculate subtotal from order items if not provided
  const subtotal = variables.subtotal ?? (variables.order_items?.reduce((sum: number, item: OrderItem) => {
    const price = Number(item.price_at_time || item.pricePerUnit || 0);
    const quantity = Number(item.quantity || 0);
    return sum + (price * quantity);
  }, 0) || 0);

  // Calculate tax amount if not provided
  const taxAmount = Number(variables.tax_amount || variables.taxAmount || 0);

  // Calculate installation price if not provided
  const installationPrice = Number(variables.installation_price || variables.installationPrice || 0);

  // Calculate total amount if not provided
  const totalAmount = Number(variables.total_amount || variables.totalAmount || (subtotal + taxAmount + installationPrice));

  // Format order items section
  const orderItemsHtml = variables.order_items?.length ? `
    <div style="margin-bottom: 32px;">
      <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 600;">Order Details</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <tr style="background-color: #f8fafc;">
          <th style="text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; color: #0f172a; font-size: 14px;">Item</th>
          <th style="text-align: center; padding: 12px; border-bottom: 2px solid #e2e8f0; color: #0f172a; font-size: 14px;">Quantity</th>
          <th style="text-align: right; padding: 12px; border-bottom: 2px solid #e2e8f0; color: #0f172a; font-size: 14px;">Price</th>
        </tr>
        ${variables.order_items.map((item: OrderItem) => {
          const title = item.product?.title || item.title || 'Product';
          const quantity = Number(item.quantity);
          const pricePerUnit = Number(item.price_at_time || item.pricePerUnit);
          const totalPrice = pricePerUnit * quantity;
          
          return `
            <tr>
              <td style="text-align: left; padding: 16px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">
                <div style="font-weight: 500;">${title}</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">$${pricePerUnit.toFixed(2)} each</div>
              </td>
              <td style="text-align: center; padding: 16px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">${quantity}</td>
              <td style="text-align: right; padding: 16px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">$${totalPrice.toFixed(2)}</td>
            </tr>
          `;
        }).join('')}
        
        <!-- Installation Service -->
        ${installationPrice > 0 ? `
        <tr>
          <td style="text-align: left; padding: 16px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">
            <div style="font-weight: 500;">Professional Installation Service</div>
          </td>
          <td style="text-align: center; padding: 16px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">1</td>
          <td style="text-align: right; padding: 16px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">$${installationPrice.toFixed(2)}</td>
        </tr>
        ` : ''}

        <!-- Subtotal -->
        <tr>
          <td colspan="2" style="text-align: right; padding: 16px 12px; font-weight: 600; color: #0f172a;">Products Subtotal:</td>
          <td style="text-align: right; padding: 16px 12px; color: #0f172a;">$${subtotal.toFixed(2)}</td>
        </tr>

        <!-- Tax -->
        ${taxAmount > 0 ? `
        <tr>
          <td colspan="2" style="text-align: right; padding: 16px 12px; font-weight: 600; color: #0f172a;">Tax:</td>
          <td style="text-align: right; padding: 16px 12px; color: #0f172a;">$${taxAmount.toFixed(2)}</td>
        </tr>
        ` : ''}

        <!-- Total -->
        <tr>
          <td colspan="2" style="text-align: right; padding: 16px 12px; font-weight: 600; color: #0f172a; font-size: 18px;">Total:</td>
          <td style="text-align: right; padding: 16px 12px; color: #2563eb; font-weight: 600; font-size: 18px;">$${totalAmount.toFixed(2)}</td>
        </tr>
      </table>
    </div>
  ` : '';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${variables.companyName} - Order Update</title>
  </head>
      <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; line-height: 1.6; background-color: #f8fafc;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <!-- Container -->
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #0f172a; padding: 32px 24px; text-align: center;">
                    <img src="${logoFullUrl}" alt="${variables.companyName}" style="height: 40px; margin-bottom: 24px;" />
                    <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0 0 8px 0;">${variables.emailType || 'Order Update'}</h1>
                    <p style="color: #e2e8f0; margin: 0; font-size: 16px;">Order #${variables.orderId}</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 32px 24px;">
                    ${formattedContent}
                    ${orderItemsHtml}
                  </td>
                </tr>

                <!-- Call to Action -->
                <tr>
                  <td style="padding: 0 24px 32px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color: #f8fafc; padding: 24px; border-radius: 8px; text-align: center;">
                          <p style="margin: 0 0 16px 0; color: #334155;">Need assistance with your order?</p>
                          <a href="mailto:${variables.supportEmail}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;">Contact Support</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 32px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <img src="${logoFullUrl}" alt="${variables.companyName}" style="height: 32px; margin-bottom: 24px;" />
                    <p style="color: #94a3b8; font-size: 14px; margin: 0 0 8px 0;">${variables.companyName}, Inc.</p>
                    <p style="color: #94a3b8; font-size: 14px; margin: 0;">© ${variables.year || new Date().getFullYear()} ${variables.companyName}. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
  </html>
  `;
};

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key is missing');
    return NextResponse.json({ error: 'OpenAI API key is missing' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { prompt, variables } = body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      console.error('Invalid or missing prompt:', { prompt });
      return NextResponse.json({ error: 'Invalid or missing prompt' }, { status: 400 });
    }

    if (!variables || typeof variables !== 'object') {
      console.error('Invalid or missing variables:', { variables });
      return NextResponse.json({ error: 'Invalid or missing variables' }, { status: 400 });
    }

    console.log('Generating email with:', {
      prompt: prompt.substring(0, 100) + '...',
      variables: {
        orderId: variables.orderId,
        firstName: variables.firstName,
        lastName: variables.lastName,
        emailType: variables.emailType,
        itemCount: variables.order_items?.length
      }
    });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Use AI configuration from variables if available, otherwise use defaults
    const aiConfig = variables.ai_config || {
      model: "gpt-4",
      temperature: 0.7,
      max_tokens: 2000,
      system_prompt: "You are a professional email composer."
    };

    console.log('Using AI config:', {
      model: aiConfig.model,
      temperature: aiConfig.temperature,
      max_tokens: aiConfig.max_tokens
    });

    // Generate content using AI with specific instructions
    const completion = await openai.chat.completions.create({
      model: aiConfig.model,
      temperature: aiConfig.temperature,
      max_tokens: aiConfig.max_tokens,
      messages: [
        {
          role: "system",
          content: aiConfig.system_prompt
        },
        {
          role: "user",
          content: `${aiConfig.additional_context || ''}\n\n${prompt}`
        }
      ]
    }).catch(error => {
      console.error('OpenAI API error:', {
        error,
        message: error.message,
        type: error.type,
        code: error.code
      });
      throw new Error(`OpenAI API error: ${error.message}`);
    });

    const emailContent = completion.choices[0]?.message?.content;
    
    if (!emailContent) {
      console.error('OpenAI returned no content:', completion);
      return NextResponse.json(
        { error: 'Failed to generate email content', details: 'OpenAI returned no content' },
        { status: 500 }
      );
    }

    console.log('Generated content successfully, length:', emailContent.length);

    try {
      // Format the email with consistent styling
      const formattedEmail = formatEmailContent(emailContent, {
        ...variables,
        emailType: variables.emailType || 'Order Update'
      });

      console.log('Formatted email successfully, length:', formattedEmail.length);

      // Return both the raw content and formatted HTML
      return NextResponse.json({ 
        html: formattedEmail,
        content: emailContent
      });
    } catch (formatError) {
      console.error('Error formatting email:', {
        error: formatError,
        message: formatError instanceof Error ? formatError.message : 'Unknown error',
        content: emailContent.substring(0, 200) + '...'
      });
      throw new Error('Failed to format email content');
    }

  } catch (error) {
    console.error('Error generating email:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Failed to generate email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 