import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { sendContractEmail } from '@/lib/email'

const TAX_RATE = 0.0775; // 7.75% for Riverside, CA

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    if (!request.body) {
      return NextResponse.json(
        { success: false, error: 'Missing request body' },
        { status: 400 }
      )
    }

    const data = await request.json()

    // Calculate amounts using our_price for products
    const productSubtotal = data.products.reduce((total: number, product: any) => 
      total + product.our_price * product.quantity, 0
    );
    const tax = productSubtotal * TAX_RATE; // Tax only on products
    const installationPrice = data.installationPrice || 0;
    const totalAmount = productSubtotal + tax + installationPrice; // Installation added after tax

    console.log('Calculated amounts:', {
      productSubtotal,
      tax,
      installationPrice,
      totalAmount
    });

    // Insert into database
    const result = await sql`
      INSERT INTO orders (
        first_name,
        last_name,
        email,
        phone,
        organization,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_zip,
        shipping_instructions,
        installation_address,
        installation_city,
        installation_state,
        installation_zip,
        installation_date,
        installation_time,
        access_instructions,
        contact_on_site,
        contact_on_site_phone,
        payment_method,
        signature_url,
        total_amount,
        installation_price,
        tax_amount,
        status
      ) VALUES (
        ${data.firstName},
        ${data.lastName},
        ${data.email},
        ${data.phone},
        ${data.organization},
        ${data.shippingAddress},
        ${data.shippingCity},
        ${data.shippingState},
        ${data.shippingZip},
        ${data.shippingInstructions},
        ${data.installationAddress},
        ${data.installationCity},
        ${data.installationState},
        ${data.installationZip},
        ${data.installationDate},
        ${data.installationTime},
        ${data.accessInstructions},
        ${data.contactOnSite},
        ${data.contactOnSitePhone},
        ${data.paymentMethod},
        ${data.signatureUrl},
        ${totalAmount},
        ${installationPrice},
        ${tax},
        'pending'
      ) RETURNING id
    `;

    const orderId = result.rows[0].id;

    // Insert order items
    for (const product of data.products) {
      await sql`
        INSERT INTO order_items (
          order_id,
          product_id,
          quantity,
          price_at_time
        ) VALUES (
          ${orderId},
          ${product.id},
          ${product.quantity},
          ${product.our_price}
        )
      `;
    }

    // Send confirmation email
    try {
      console.log('Sending confirmation email to:', data.email);
      
      await sendContractEmail({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        organization: data.organization,
        orderId: orderId,
        orderItems: data.products.map((product: any) => ({
          product: { title: product.title },
          quantity: product.quantity,
          price_at_time: product.our_price
        })),
        totalAmount: totalAmount,
        installationPrice: installationPrice,
        shippingAddress: data.shippingAddress,
        shippingCity: data.shippingCity,
        shippingState: data.shippingState,
        shippingZip: data.shippingZip,
        shippingInstructions: data.shippingInstructions,
        installationAddress: data.installationAddress,
        installationCity: data.installationCity,
        installationState: data.installationState,
        installationZip: data.installationZip,
        installationDate: data.installationDate,
        installationTime: data.installationTime,
        accessInstructions: data.accessInstructions,
        contactOnSite: data.contactOnSite,
        contactOnSitePhone: data.contactOnSitePhone,
        paymentMethod: data.paymentMethod,
        signature_url: data.signatureUrl,
        taxAmount: tax
      });

      console.log('Email sent successfully');
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Return error response if email fails
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send confirmation email',
        details: emailError instanceof Error ? emailError.message : 'Unknown error'
      }, { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Contract created successfully',
      orderId: orderId,
      totalAmount: totalAmount,
      taxAmount: tax
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create contract'
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 