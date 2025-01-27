import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      organization,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZip,
      shippingInstructions,
      installationAddress,
      installationCity,
      installationState,
      installationZip,
      installationDate,
      installationTime,
      accessInstructions,
      contactOnSite,
      contactOnSitePhone,
      paymentMethod,
      totalAmount,
      installationPrice,
      signature,
      products
    } = await req.json();

    // Insert the order
    const result = await sql`
      INSERT INTO Orders (
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
        contact_onsite,
        contact_onsite_phone,
        payment_method,
        total_amount,
        installation_price,
        signature_url,
        status
      ) VALUES (
        ${firstName},
        ${lastName},
        ${email},
        ${phone},
        ${organization},
        ${shippingAddress},
        ${shippingCity},
        ${shippingState},
        ${shippingZip},
        ${shippingInstructions},
        ${installationAddress},
        ${installationCity},
        ${installationState},
        ${installationZip},
        ${installationDate},
        ${installationTime},
        ${accessInstructions},
        ${contactOnSite},
        ${contactOnSitePhone},
        ${paymentMethod},
        ${totalAmount},
        ${installationPrice},
        ${signature},
        'pending'
      ) RETURNING id
    `;

    const orderId = result.rows[0].id;

    // Insert order items
    for (const product of products) {
      await sql`
        INSERT INTO OrderItems (
          order_id,
          product_id,
          quantity,
          price_at_time
        ) VALUES (
          ${orderId},
          ${product.id},
          ${product.quantity},
          ${product.our_price || product.price}
        )
      `;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Order created successfully',
      orderId 
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}