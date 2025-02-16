import { NextRequest, NextResponse } from 'next/server';
import { getEmailTemplate } from '@/lib/email-templates';
import { sql } from '@vercel/postgres';
import { Order } from '@/lib/email-templates';
import { formatEmailContent } from '@/lib/email-templates';
import fs from 'fs/promises';
import path from 'path';
import { safeFetch } from '@/lib/safeFetch';

// Add price formatting helper
const formatPrice = (price: number | string | null | undefined): string => {
  if (price === null || price === undefined) return '0.00';
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(numericPrice) ? '0.00' : numericPrice.toFixed(2);
};

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

// Configure for Vercel Serverless Function
export const dynamic = 'force-dynamic';
export const maxDuration = 10; // 10 seconds max for initial response

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
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://wayofglory.com';
  }
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  return `${protocol}://${host}`;
}

function timeout(ms: number) {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Operation timed out')), ms)
  );
}

export async function POST(request: NextRequest, context: any): Promise<NextResponse> {
  const { params } = context;
  console.log('Starting send-template process...');
  
  // Enhanced PWA detection
  const isPWA = request.headers.get('x-pwa-request') === 'true' || 
                request.headers.get('display-mode') === 'standalone' ||
                request.headers.get('sec-fetch-dest') === 'serviceworker';
  
  console.log('Request type:', isPWA ? 'PWA' : 'Web');

  try {
    const rawBody = await request.text();
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (error) {
      console.error('Failed to parse request body:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        body: rawBody.substring(0, 200)
      });
      return new NextResponse(JSON.stringify({
        error: 'Invalid JSON in request body',
        details: error instanceof Error ? error.message : 'Failed to parse request body',
        success: false,
        isPWA
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }

    const { templateId, customEmail, customPrompt } = body;
    const orderIdStr = params.orderId;
    const orderId = parseInt(orderIdStr);

    // Validate inputs
    if (!orderIdStr || isNaN(orderId)) {
      return new NextResponse(JSON.stringify({
        error: 'Invalid Order ID',
        success: false,
        isPWA
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }

    if (!templateId && !customEmail) {
      return new NextResponse(JSON.stringify({
        error: 'Template ID or custom email content is required',
        success: false,
        isPWA
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }

    const baseUrl = getBaseUrl(request);
    console.log('Using baseUrl:', baseUrl);
    
    // Get order details with timeout
    const orderQuery = sql`
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

    const result = await Promise.race([
      orderQuery,
      timeout(5000)  // 5 second timeout for database query
    ]) as { rows: any[] };

    const { rows: [orderData] } = result;

    if (!orderData) {
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
      logoUrl: `${baseUrl}/images/logo/LogoLight.png`,
      logoLightUrl: `${baseUrl}/images/logo/LogoLight.png`,
      logoNormalUrl: `${baseUrl}/images/logo/logo.png`,
      year: new Date().getFullYear(),
      installationDate: order.installation_date ? new Date(order.installation_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '',
      installationTime: order.installation_date ? new Date(order.installation_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '',
      includesInstallation: !!order.installation_date || (installationPrice > 0)
    };

    if (customEmail?.html) {
      const subject = customEmail.subject || `Order Update - Way of Glory #${orderId}`;
      try {
        // Format custom emails with the same template as generated ones
        const emailContent = formatEmailContent(customEmail.html, {
          ...baseVariables,
          order_items: orderItems,
          subtotal: formatPrice(subtotal),
          tax_amount: formatPrice(taxAmount),
          installation_price: formatPrice(installationPrice),
          totalAmount: formatPrice(totalAmount),
          emailType: 'Custom Email',
          logoUrl: isPWA ? 
            'https://wayofglory.com/images/logo/logo.png' : 
            `${baseUrl}/images/logo/logo.png`,
          logoNormalUrl: isPWA ? 
            'https://wayofglory.com/images/logo/LogoLight.png' : 
            `${baseUrl}/images/logo/LogoLight.png`,
          baseUrl,
          isPWA
        });

        // Log the email
        await sql`
          INSERT INTO email_logs (order_id, subject, content, template_id)
          VALUES (${orderId}, ${subject}, ${emailContent}, ${templateId})
        `;

        // Send the email
        const sendEmailUrl = `${baseUrl}/api/admin/send-email`;
        const sendResult = await safeFetch(sendEmailUrl, {
          method: 'POST',
          body: JSON.stringify({
            email: order.email,
            subject,
            html: emailContent,
            text: customEmail.content,
            isPWA
          })
        });

        if (!sendResult.ok) {
          console.error('Failed to send email:', sendResult.data);
          throw new Error(sendResult.data?.error || sendResult.data?.details || 'Failed to send email');
        }

        return new NextResponse(JSON.stringify({
          success: true,
          isPWA,
          message: 'Email sent successfully'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          }
        });

      } catch (error: any) {
        console.error('Error in send-template:', {
          error: error.message,
          stack: error.stack,
          phase: 'sending custom email'
        });
        return new NextResponse(JSON.stringify({
          error: 'Failed to send email',
          details: error.message,
          success: false,
          isPWA
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          }
        });
      }
    } else {
      try {
        const template = getEmailTemplate(templateId, order);
        const generateEmailUrl = `${baseUrl}/api/admin/generate-email`;
        
        console.log('Generating email with:', {
          templateId,
          baseUrl,
          prompt: template.prompt.substring(0, 100) + '...',
          variables: template.variables,
          isPWA
        });

        // Prepare all variables needed for the template
        const templateVariables = {
          ...baseVariables,
          ...template.variables,
          order_items: orderItems,
          subtotal: formatPrice(subtotal),
          tax_amount: formatPrice(taxAmount),
          installation_price: formatPrice(installationPrice),
          totalAmount: formatPrice(totalAmount),
          emailType: template.variables.emailType || 'Order Update',
          logoUrl: isPWA ? 
            'https://wayofglory.com/images/logo/LogoLight.png' : 
            `${baseUrl}/images/logo/LogoLight.png`,
          logoNormalUrl: isPWA ? 
            'https://wayofglory.com/images/logo/logo.png' : 
            `${baseUrl}/images/logo/logo.png`,
          baseUrl: isPWA ? 'https://wayofglory.com' : baseUrl,
          year: new Date().getFullYear(),
          installationDate: order.installation_date ? new Date(order.installation_date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }) : '',
          installationTime: order.installation_date ? new Date(order.installation_date).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
          }) : '',
          includesInstallation: !!order.installation_date || (installationPrice > 0)
        };

        const generateResult = await safeFetch(generateEmailUrl, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          },
          body: JSON.stringify({ 
            orderId,
            prompt: customPrompt || template.prompt,
            variables: templateVariables,
            isPWA
          }),
          cache: 'no-store'
        });
        
        if (!generateResult.ok) {
          console.error('Failed to generate email:', {
            status: generateResult.status,
            error: generateResult.data?.error,
            details: generateResult.data?.details
          });
          return new NextResponse(JSON.stringify({
            error: 'Failed to generate email',
            details: generateResult.data?.error || generateResult.data?.details || 'Email generation failed',
            success: false,
            isPWA
          }), {
            status: generateResult.status || 500,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store'
            }
          });
        }

        // Ensure we have valid content from the generator
        if (!generateResult.data?.html) {
          console.error('Invalid generator response:', generateResult.data);
          return new NextResponse(JSON.stringify({
            error: 'Invalid response from email generator',
            details: 'Missing required HTML content in response',
            success: false,
            isPWA,
            errorData: generateResult.data
          }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store'
            }
          });
        }

        try {
          // Use only the HTML content, which already includes all formatting
          const emailContent = generateResult.data.html;

          // Log the email
          await sql`
            INSERT INTO email_logs (order_id, subject, content, template_id)
            VALUES (${orderId}, ${template.subject}, ${emailContent}, ${templateId})
          `;

          // Send the email with only the HTML content
          const sendResult = await safeFetch(`${baseUrl}/api/admin/send-email`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store'
            },
            body: JSON.stringify({ 
              email: order.email, 
              subject: template.subject, 
              html: emailContent,
              isPWA
            }),
            cache: 'no-store'
          });

          if (!sendResult.ok) {
            console.error('Send email error:', {
              status: sendResult.status,
              data: sendResult.data,
              error: sendResult.data?.error,
              details: sendResult.data?.details
            });
            throw new Error(sendResult.data?.error || sendResult.data?.details || 'Failed to send email');
          }

          return new NextResponse(JSON.stringify({ 
            success: true,
            isPWA,
            message: 'Email sent successfully',
            preview: emailContent
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store'
            }
          });

        } catch (e: any) {
          console.error('Error formatting or sending email:', {
            error: e.message,
            stack: e.stack,
            content: generateResult.data?.content?.substring(0, 200)
          });
          return new NextResponse(JSON.stringify({
            error: 'Failed to format or send email',
            details: e.message,
            success: false,
            isPWA
          }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store'
            }
          });
        }
      } catch (error: any) {
        console.error('Error in send-template:', {
          error: error.message,
          stack: error.stack,
          phase: 'generating and sending template email'
        });
        
        return new NextResponse(JSON.stringify({ 
          error: error.message.includes('timed out') ? 'Email generation timeout' : 'Failed to generate or send email',
          details: error.message,
          success: false,
          isPWA
        }), { 
          status: error.message.includes('timed out') ? 504 : 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          }
        });
      }
    }
  } catch (error: any) {
    console.error('Error in send-template:', {
      error: error.message,
      stack: error.stack,
      phase: 'request processing'
    });
    return new NextResponse(JSON.stringify({
      error: 'Failed to process request',
      details: error.message,
      success: false,
      isPWA
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }
} 