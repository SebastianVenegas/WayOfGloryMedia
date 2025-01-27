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
    
    // Calculate totals
    const productsSubtotal = data.products.reduce((sum: number, product: any) => 
      sum + (product.our_price || product.price) * product.quantity, 0
    );
    const taxAmount = productsSubtotal * TAX_RATE;
    const totalAmount = productsSubtotal + taxAmount + (data.installationPrice || 0);

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
        contact_onsite,
        contact_onsite_phone,
        payment_method,
        total_amount,
        installation_price,
        signature_url,
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
        ${totalAmount},
        ${data.installationPrice || 0},
        ${data.signature},
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
          ${product.our_price || product.price}
        )
      `;
    }

    // Simulate a delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Send confirmation email
    try {
      await sendContractEmail({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        organization: data.organization || '',
        orderId,
        orderItems: data.products.map((product: any) => ({
          product: { title: product.title },
          quantity: product.quantity,
          price_at_time: product.our_price || product.price
        })),
        totalAmount,
        installationPrice: data.installationPrice || 0,
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
        signature: data.signature,
        taxAmount
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Continue with success response even if email fails
    }

    return NextResponse.json({ 
      success: true,
      message: 'Contract created successfully',
      orderId
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error creating contract:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create contract'
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
} 