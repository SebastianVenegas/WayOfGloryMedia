import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getEmailTemplate, formatEmailContent, type Order } from '@/lib/email-templates';
import fs from 'fs/promises';
import path from 'path';
import { safeFetch } from '@/lib/safeFetch';

// Add price formatting helper
const formatPrice = (price: number | string | null | undefined): string => {
  if (price === null || price === undefined) return '0.00';
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(numericPrice) ? '0.00' : numericPrice.toFixed(2);
};

// Add numeric conversion helper
const toNumber = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
};

interface OrderItem {
  quantity: number;
  price_at_time: number | string;
  title?: string;
  pricePerUnit?: number;
  product?: {
    title?: string;
    category?: string;
  };
}

// Add the getBaseUrl helper to dynamically compute the base URL
function getBaseUrl(request: NextRequest, isPWA: boolean): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (process.env.NODE_ENV === 'production' || isPWA) {
    return 'https://wayofglory.com';
  }
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  return `${protocol}://${host}`;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const orderId = request.nextUrl.pathname.split('/')[4];
  
  // Enhanced PWA detection
  const isPWA = request.headers.get('x-pwa-request') === 'true' || 
                request.headers.get('display-mode') === 'standalone' ||
                request.headers.get('sec-fetch-dest') === 'serviceworker' ||
                process.env.NEXT_PUBLIC_PWA === 'true';
  
  try {
    // Use absolute URLs for logos
    const baseUrl = getBaseUrl(request, isPWA);
    const logoLightUrl = 'https://wayofglory.com/images/logo/LogoLight.png';
    const logoNormalUrl = 'https://wayofglory.com/images/logo/logo.png';

    if (!orderId) {
      console.error('Missing orderId in URL');
      return NextResponse.json({ 
        error: 'Order ID is required',
        success: false,
        isPWA
      }, { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    const orderId_int = parseInt(orderId);
    if (isNaN(orderId_int)) {
      console.error('Invalid orderId format:', orderId);
      return NextResponse.json({ error: 'Invalid Order ID' }, { status: 400 });
    }

    const templateId = searchParams.get('templateId');
    const userPrompt = searchParams.get('prompt');
    
    if (!templateId) {
      console.error('Missing templateId in query params');
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    // For custom emails, we need a prompt
    if (templateId === 'custom_email' && !userPrompt) {
      console.error('Missing prompt for custom email');
      return NextResponse.json({ error: 'Prompt is required for custom emails' }, { status: 400 });
    }

    console.log('Preview template request:', {
      orderId: orderId_int,
      templateId,
      prompt: userPrompt ? userPrompt.substring(0, 100) + '...' : undefined
    });

    // Fetch order details with order items
    const result = await sql`
      SELECT 
        o.*,
        COALESCE(json_agg(
          json_build_object(
            'quantity', oi.quantity,
            'price_at_time', oi.price_at_time,
            'product', json_build_object(
              'title', p.title,
              'description', p.description,
              'category', p.category
            )
          )
        ) FILTER (WHERE oi.id IS NOT NULL), '[]') as order_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = ${orderId_int}
      GROUP BY o.id;
    `;

    if (result.rows.length === 0) {
      console.error('Order not found:', orderId_int);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = result.rows[0];

    // Process order items with proper price formatting
    const orderItems = orderData.order_items?.map((item: OrderItem) => {
      const quantity = toNumber(item.quantity);
      const priceAtTime = toNumber(item.price_at_time);
      
      return {
        title: item.product?.title || 'Product',
        quantity: quantity,
        price: formatPrice(quantity * priceAtTime),
        pricePerUnit: formatPrice(priceAtTime),
        product: item.product
      };
    }) || [];

    // Calculate totals with proper formatting
    const subtotal = orderItems.reduce((sum: number, item: { price: string }) => 
      sum + toNumber(item.price), 0);
    const taxAmount = toNumber(orderData.tax_amount);
    const installationPrice = toNumber(orderData.installation_price);
    const totalAmount = subtotal + taxAmount + installationPrice;

    // Format the order data
    const order: Order = {
      id: orderData.id,
      first_name: orderData.first_name,
      last_name: orderData.last_name,
      email: orderData.email,
      total_amount: formatPrice(totalAmount),
      tax_amount: formatPrice(taxAmount),
      created_at: orderData.created_at,
      status: orderData.status,
      order_items: orderItems,
      installation_price: formatPrice(installationPrice),
      installation_date: orderData.installation_date,
      installation_time: orderData.installation_time
    };

    let template;
    let templatePrompt;

    if (templateId === 'custom_email') {
      // First, get the AI-generated content from custom-email endpoint
      const customEmailResponse = await fetch(`${baseUrl}/api/admin/orders/${orderId_int}/custom-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pwa-request': 'true'
        },
        body: JSON.stringify({
          prompt: userPrompt,
          variables: {
            orderId: order.id,
            firstName: order.first_name,
            lastName: order.last_name,
            status: order.status,
            includesInstallation: !!order.installation_date,
            installationDate: order.installation_date,
            installationTime: order.installation_time
          }
        })
      });

      if (!customEmailResponse.ok) {
        const errorData = await customEmailResponse.json();
        throw new Error(errorData.error || 'Failed to generate custom email');
      }

      const customEmailData = await customEmailResponse.json();
      
      // Use the AI-generated content but format it with our template
      template = {
        subject: customEmailData.subject || `Order Update - Way of Glory #${order.id}`,
        prompt: userPrompt || '',
        variables: {
          orderId: order.id,
          firstName: order.first_name,
          lastName: order.last_name,
          email: order.email,
          totalAmount: formatPrice(totalAmount),
          createdAt: order.created_at,
          status: order.status,
          order_items: orderItems,
          subtotal: formatPrice(subtotal),
          tax_amount: formatPrice(taxAmount),
          installation_price: formatPrice(installationPrice),
          companyName: 'Way of Glory Media',
          supportEmail: 'help@wayofglory.com',
          websiteUrl: 'https://wayofglory.com',
          logoUrl: logoLightUrl,
          logoNormalUrl: logoNormalUrl,
          year: new Date().getFullYear(),
          emailType: 'Custom Email',
          baseUrl: baseUrl
        }
      };
      
      // Return the response immediately with the formatted content
      return NextResponse.json({
        subject: template.subject,
        content: customEmailData.content,
        html: formatEmailContent(customEmailData.content, template.variables)
      });
    } else {
      template = getEmailTemplate(templateId, order);
      if (!template) {
        console.error('Template not found:', templateId);
        return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
      }
      template.variables = {
        ...template.variables,
        logoUrl: logoLightUrl,
        logoNormalUrl: logoNormalUrl,
        order_items: orderItems,
        subtotal: formatPrice(subtotal),
        tax_amount: formatPrice(taxAmount),
        installation_price: formatPrice(installationPrice),
        totalAmount: formatPrice(totalAmount)
      };
      templatePrompt = template.prompt;
    }

    // Generate content using the generate-email endpoint
    const generateUrl = `${baseUrl}/api/admin/generate-email`;
    
    console.log('Generating email with:', {
      templateId,
      prompt: templatePrompt.substring(0, 100) + '...',
      variables: template.variables,
      isPWA: true,
      logoUrls: {
        light: logoLightUrl,
        normal: logoNormalUrl
      }
    });

    const generatePayload = {
      prompt: templatePrompt,
      content: templatePrompt,
      variables: {
        ...template.variables,
        logoUrl: logoNormalUrl,
        logoNormalUrl: logoNormalUrl,
        logoLightUrl: logoLightUrl,
        baseUrl: baseUrl,
        isPWA: true
      },
      orderId: orderId_int,
      isPWA: true
    };

    let generateResult;
    try {
      const maxRetries = 3;
      let attempt = 0;
      let lastError;

      while (attempt < maxRetries) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

          const response = await safeFetch(generateUrl, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'x-pwa-request': 'true'
            },
            body: JSON.stringify(generatePayload),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorDetails = response.data?.error || 'Unknown error';
            console.error(`Email generation failed (attempt ${attempt + 1}/${maxRetries}):`, {
              status: response.status,
              error: errorDetails
            });
            lastError = errorDetails;
            
            // If it's not a timeout error, don't retry
            if (response.status !== 504 && response.status !== 408) {
              throw new Error(errorDetails);
            }
          } else {
            generateResult = response.data;
            break; // Success, exit retry loop
          }
        } catch (error) {
          lastError = error;
          console.error(`Attempt ${attempt + 1}/${maxRetries} failed:`, error);
        }

        attempt++;
        if (attempt < maxRetries) {
          // Exponential backoff: wait longer between each retry
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }

      if (!generateResult) {
        return NextResponse.json({ 
          error: 'Failed to generate email after multiple attempts',
          details: lastError?.toString() || 'Maximum retry attempts reached',
          success: false 
        }, { 
          status: 500 
        });
      }

      // Validate the generated content
      if (!generateResult.html && !generateResult.content) {
        console.error('Invalid template response:', generateResult);
        return NextResponse.json({ 
          error: 'Failed to generate email content',
          details: 'The template generator returned an invalid response',
          success: false 
        }, { 
          status: 500 
        });
      }

      // Return the successful response
      return NextResponse.json({
        subject: template.subject,
        content: generateResult.content || '',
        html: generateResult.html || '',
        success: true
      }, {
        status: 200
      });

    } catch (err) {
      console.error('Error calling generate-email:', err);
      
      // Determine if it's a timeout error
      const isTimeout = err instanceof Error && 
        (err.message.includes('timeout') || err.message.includes('504'));
      
      return NextResponse.json({ 
        error: isTimeout ? 'Email generation timed out' : 'Failed to generate email content',
        details: err instanceof Error ? err.message : 'Unknown error',
        success: false
      }, { 
        status: isTimeout ? 504 : 500
      });
    }

  } catch (error) {
    console.error('Error in preview-template:', error);
    return NextResponse.json({ 
      error: 'Failed to generate email preview',
      details: error instanceof Error ? error.message : 'An unexpected error occurred',
      success: false,
      isPWA
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }
}