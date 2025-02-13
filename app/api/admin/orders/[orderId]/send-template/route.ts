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

export async function POST(request: NextRequest, context: any): Promise<NextResponse> {
  try {
    console.log('Starting send-template process...');
    const { templateId, customEmail, customPrompt } = await request.json();
    const orderIdStr = context?.params?.orderId || request.nextUrl.pathname.split('/')[4];
    const orderId = parseInt(orderIdStr);

    // Use absolute URLs for logos
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || 'http://localhost:3000';
    const logoLightUrl = `${baseUrl}/images/logo/LogoLight.png`;
    const logoNormalUrl = `${baseUrl}/images/logo/logo.png`;

    // Log logo URLs for debugging
    console.log('Logo URLs:', { baseUrl, logoLightUrl, logoNormalUrl });

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
        const sendResponse = await fetch(`${baseUrl}/api/admin/send-email`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            email: order.email, 
            subject: subject, 
            html: emailContent, 
            text: customEmail.content 
          })
        });

        const textResponse = await sendResponse.text();
        let sendResult;
        try {
          sendResult = JSON.parse(textResponse);
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', textResponse);
          throw new Error(`Invalid JSON response: ${textResponse}`);
        }

        if (!sendResponse.ok) {
          console.error('Send email failed:', {
            status: sendResponse.status,
            statusText: sendResponse.statusText,
            error: sendResult
          });
          return NextResponse.json({ 
            error: 'Failed to send email', 
            details: sendResult?.error || sendResponse.statusText 
          }, { status: sendResponse.status });
        }

        console.log('Email sent successfully:', sendResult);
        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Error sending email:', error);
        return NextResponse.json({ 
          error: 'Failed to send email', 
          details: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
      }
    } else {
      console.log('Generating email content from template');
      const template = getEmailTemplate(templateId, order);
      const prompt = customPrompt || template.prompt;
      template.variables = { ...template.variables, logoUrl: logoLightUrl };

      try {
        const generateResponse = await fetch(`${baseUrl}/api/admin/generate-email`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            prompt: prompt, 
            variables: { ...template.variables } 
          })
        });

        const textResponse = await generateResponse.text();
        let data;
        try {
          data = JSON.parse(textResponse);
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', textResponse);
          throw new Error(`Invalid JSON response: ${textResponse}`);
        }

        if (!generateResponse.ok) {
          console.error('Generate email failed:', {
            status: generateResponse.status,
            statusText: generateResponse.statusText,
            error: data
          });
          return NextResponse.json({ 
            error: 'Failed to generate email content', 
            details: data?.error || data?.details || generateResponse.statusText 
          }, { status: generateResponse.status });
        }

        if (!data.html || !data.content) {
          console.error('Invalid response from generate-email:', data);
          return NextResponse.json({ 
            error: 'Generate email returned invalid content', 
            details: 'Missing html or content in response' 
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
          logoUrl: logoLightUrl
        });

        return NextResponse.json({ 
          subject: template.subject, 
          content: data.content, 
          html: formattedHtml 
        });
      } catch (error) {
        console.error('Error generating email:', error);
        return NextResponse.json({ 
          error: 'Failed to generate email', 
          details: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Error in send-template:', error);
    return NextResponse.json({ 
      error: 'Failed to process request', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 