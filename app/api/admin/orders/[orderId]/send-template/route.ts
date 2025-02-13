import { NextRequest, NextResponse } from 'next/server';
import { getEmailTemplate } from '@/lib/email-templates';
import { sql } from '@vercel/postgres';
import { Order } from '@/lib/email-templates';
import { formatEmailContent } from '@/lib/email-templates';
import fs from 'fs/promises';
import path from 'path';

interface Product {
  title?: string;
  description?: string;
  category?: string;
  features?: string[];
  technical_details?: Record<string, string>;
  included_items?: string[];
  warranty_info?: string;
  installation_available?: boolean;
}

interface OrderItem {
  quantity: number;
  price_at_time: number;
  title?: string;
  pricePerUnit?: number;
  product?: Product;
}

async function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('JSON Parse Error:', error);
    console.error('Raw text:', text);
    return null;
  }
}

function getBaseUrl(request: NextRequest): string {
  // For production, use the Vercel deployment URL from environment variable or fallback
  if (process.env.VERCEL_ENV === 'production') {
    return process.env.VERCEL_URL ? 
      `https://${process.env.VERCEL_URL}` : 
      'https://way-of-glory-media.vercel.app';
  }
  
  // For development
  const host = request.headers.get('host');
  return `http://${host}`;
}

async function safeFetch(url: string, options: RequestInit) {
  try {
    // Log the full request details for debugging
    console.log('Making request with full details:', {
      url,
      method: options.method,
      headers: options.headers,
      body: options.body ? JSON.parse(options.body.toString()) : undefined
    });

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      next: { revalidate: 0 } // Disable caching
    });

    // Log the full response details
    const text = await response.text();
    console.log('Full response details:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      text: text.substring(0, 500) // Log more of the response for debugging
    });

    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      const parseError = error as Error;
      console.error('JSON Parse Error:', {
        error: parseError,
        text: text,
        textLength: text.length,
        textPreview: text.substring(0, 1000)
      });
      throw new Error(`Failed to parse response as JSON: ${parseError.message}`);
    }

    if (!response.ok) {
      throw new Error(data?.error || data?.details || response.statusText || 'Request failed');
    }

    return { ok: true, data };
  } catch (error: any) {
    console.error('Fetch error with full details:', {
      error,
      message: error.message,
      name: error.name,
      stack: error.stack,
      url
    });
    throw error;
  }
}

export async function POST(request: NextRequest, context: any): Promise<NextResponse> {
  try {
    console.log('Starting send-template process...');
    const { templateId, customEmail, customPrompt } = await request.json();
    const orderIdStr = context?.params?.orderId || request.nextUrl.pathname.split('/')[4];
    const orderId = parseInt(orderIdStr);

    // Get base URL using the new function
    const baseUrl = getBaseUrl(request);
    console.log('Using base URL:', baseUrl);

    // Use dynamic base URL for logos
    const logoLightUrl = `${baseUrl}/images/logo/LogoLight.png`;
    const logoNormalUrl = `${baseUrl}/images/logo/logo.png`;

    // Log full request details
    console.log('Full request details:', {
      baseUrl,
      logoUrls: { logoLightUrl, logoNormalUrl },
      headers: Object.fromEntries(request.headers.entries()),
      orderId,
      templateId,
      customEmail: customEmail ? {
        hasHtml: !!customEmail.html,
        hasSubject: !!customEmail.subject,
        formatOnly: !!customEmail.formatOnly
      } : null,
      hasCustomPrompt: !!customPrompt
    });

    if (isNaN(orderId)) {
      console.error('Invalid orderId format:', orderIdStr);
      return NextResponse.json({ error: 'Invalid Order ID' }, { status: 400 });
    }

    // Get order details
    const { rows: [orderData] } = await sql`
      SELECT o.*,
        COALESCE(json_agg(
          json_build_object(
            'id', oi.id,
            'quantity', oi.quantity,
            'price_at_time', oi.price_at_time,
            'product', json_build_object(
              'id', p.id,
              'title', p.title,
              'description', p.description,
              'category', p.category,
              'features', p.features,
              'technical_details', p.technical_details,
              'included_items', p.included_items,
              'warranty_info', p.warranty_info,
              'installation_available', p.installation_available
            )
          ) ORDER BY oi.id
        ) FILTER (WHERE oi.id IS NOT NULL), '[]') as order_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = ${orderId}
      GROUP BY o.id
    `;

    if (!orderData) {
      console.error('Order not found:', orderId);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Cast the database result to Order type
    const order: Order = {
      id: orderData.id,
      first_name: orderData.first_name,
      last_name: orderData.last_name,
      email: orderData.email,
      total_amount: orderData.total_amount,
      tax_amount: orderData.tax_amount,
      created_at: orderData.created_at,
      status: orderData.status,
      order_items: orderData.order_items,
      installation_price: orderData.installation_price,
      installation_date: orderData.installation_date
    };

    // Calculate order items and totals
    const orderItems = order.order_items?.map((item: OrderItem) => {
      const quantity = Number(item.quantity) || 0;
      const priceAtTime = Number(item.price_at_time) || 0;
      const price = priceAtTime * quantity;
      if (price > 0 && quantity > 0) {
        return {
          title: item.product?.title || 'Product',
          quantity: quantity,
          price: price,
          pricePerUnit: priceAtTime,
          product: { title: item.product?.title || 'Product' }
        };
      }
      return null;
    }).filter(item => item !== null) || [];

    const subtotal = orderItems.reduce((sum, item) => sum + (item!.price || 0), 0);
    const taxAmount = Number(orderData.tax_amount || 0);
    const installationPrice = Number(orderData.installation_price || 0);
    const totalAmount = subtotal + taxAmount + installationPrice;

    const baseVariables = {
      orderId: order.id,
      firstName: order.first_name,
      lastName: order.last_name,
      email: order.email,
      totalAmount: totalAmount,
      createdAt: order.created_at,
      status: order.status,
      order_items: orderItems,
      subtotal: subtotal,
      tax_amount: taxAmount,
      installation_price: installationPrice,
      companyName: 'Way of Glory Media',
      supportEmail: 'help@wayofglory.com',
      websiteUrl: 'https://wayofglory.com',
      logoUrl: logoLightUrl,
      logoLightUrl: logoLightUrl,
      logoNormalUrl: logoNormalUrl,
      year: new Date().getFullYear(),
      installationDate: order.installation_date ? new Date(order.installation_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '',
      installationTime: order.installation_date ? new Date(order.installation_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '',
      includesInstallation: !!order.installation_date || (installationPrice > 0)
    };

    if (customEmail?.html) {
      console.log('Using custom email content');
      if (!customEmail.html) {
        console.error('Missing content in custom email');
        throw new Error('Custom email content is missing');
      }

      const subject = customEmail.subject || `Order Update - Way of Glory #${order.id}`;
      const emailContent = formatEmailContent(customEmail.html, {
        ...baseVariables,
        order_items: orderItems,
        subtotal,
        tax_amount: taxAmount,
        installation_price: installationPrice,
        totalAmount,
        emailType: (subject || `Order Update - Way of Glory #${order.id}`).replace(' - Way of Glory', '').replace(` #${order.id}`, ''),
        companyName: 'Way of Glory Media',
        supportEmail: 'help@wayofglory.com',
        logoUrl: logoLightUrl,
        logoLightUrl,
        logoNormalUrl,
        createdAt: order.created_at,
        status: order.status,
        installationDate: order.installation_date ? new Date(order.installation_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '',
        installationTime: order.installation_date ? new Date(order.installation_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '',
        includesInstallation: !!order.installation_date || (order.installation_price && Number(order.installation_price) > 0),
        websiteUrl: 'https://wayofglory.com',
        year: new Date().getFullYear()
      });

      if (customEmail.formatOnly) {
        return NextResponse.json({ html: emailContent, subject: subject });
      }

      await sql`
        INSERT INTO email_logs (order_id, subject, content, template_id)
        VALUES (${orderId}, ${subject}, ${emailContent}, ${templateId})
      `;

      try {
        const sendEmailUrl = `${baseUrl}/api/admin/send-email`;
        console.log('Sending email using URL:', sendEmailUrl);

        const emailPayload = { 
          email: order.email, 
          subject: subject, 
          html: emailContent, 
          text: customEmail.content 
        };

        console.log('Email payload preview:', {
          ...emailPayload,
          html: emailPayload.html.substring(0, 200) + '...',
          text: emailPayload.text?.substring(0, 200) + '...'
        });

        const { data: sendResult } = await safeFetch(sendEmailUrl, {
          method: 'POST',
          body: JSON.stringify(emailPayload)
        });

        console.log('Email sent successfully:', sendResult);
        return NextResponse.json({ success: true });
      } catch (error: any) {
        console.error('Detailed error sending email:', {
          error,
          message: error.message,
          stack: error.stack,
          type: error.name
        });
        return NextResponse.json({ 
          error: 'Failed to send email', 
          details: error.message,
          context: 'Error occurred while sending email',
          type: error.name
        }, { status: 500 });
      }
    } else {
      console.log('Generating email content from template');
      const template = getEmailTemplate(templateId, order);
      const prompt = customPrompt || template.prompt;
      template.variables = { 
        ...template.variables, 
        logoUrl: logoLightUrl,
        baseUrl
      };

      try {
        const generateEmailUrl = `${baseUrl}/api/admin/generate-email`;
        console.log('Generating email using URL:', generateEmailUrl);

        const generatePayload = { 
          prompt: prompt, 
          variables: { 
            ...template.variables
          }
        };

        console.log('Generate email payload:', generatePayload);

        const { data } = await safeFetch(generateEmailUrl, {
          method: 'POST',
          body: JSON.stringify(generatePayload)
        });

        if (!data.html || !data.content) {
          console.error('Invalid response from generate-email:', data);
          return NextResponse.json({ 
            error: 'Generate email returned invalid content', 
            details: 'Missing html or content in response',
            context: 'Response validation failed'
          }, { status: 500 });
        }

        const formattedHtml = formatEmailContent(data.content, {
          ...template.variables,
          order_items: orderItems,
          subtotal,
          tax_amount: taxAmount,
          installation_price: installationPrice,
          totalAmount,
          emailType: template.variables.emailType || 'Order Update',
          logoUrl: logoLightUrl,
          baseUrl: 'https://wayofglory.com'
        });

        return NextResponse.json({ 
          subject: template.subject, 
          content: data.content, 
          html: formattedHtml 
        });
      } catch (error: any) {
        console.error('Detailed error generating email:', {
          error,
          message: error.message,
          stack: error.stack,
          type: error.name
        });
        return NextResponse.json({ 
          error: 'Failed to generate email', 
          details: error.message,
          context: 'Error occurred while generating email',
          type: error.name
        }, { status: 500 });
      }
    }
  } catch (error: any) {
    console.error('Detailed error in send-template:', {
      error,
      message: error.message,
      stack: error.stack,
      type: error.name,
      url: request.url
    });
    return NextResponse.json({ 
      error: 'Failed to process request', 
      details: error.message || 'Unknown error',
      context: 'Top-level error handler',
      type: error.name,
      url: request.url
    }, { status: 500 });
  }
} 