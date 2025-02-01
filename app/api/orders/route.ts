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

    // Calculate subtotals and tax
    const { productSubtotal, serviceSubtotal } = products.reduce((acc: any, item: any) => {
      const itemPrice = item.our_price || item.price;
      const itemTotal = itemPrice * item.quantity;
      
      if (item.category === 'Services' || item.category === 'Services/Custom' || item.is_service || item.is_custom) {
        return {
          ...acc,
          serviceSubtotal: acc.serviceSubtotal + itemTotal
        };
      }
      return {
        ...acc,
        productSubtotal: acc.productSubtotal + itemTotal
      };
    }, { productSubtotal: 0, serviceSubtotal: 0 });

    // Only calculate tax on products, not on services
    const TAX_RATE = 0.0775; // 7.75%
    const tax = productSubtotal * TAX_RATE;
    const total = productSubtotal + serviceSubtotal + tax + (installationPrice || 0);

    // Calculate profits
    const productProfit = productSubtotal * 0.2155; // 21.55% profit on products
    const serviceProfit = serviceSubtotal; // 100% profit on services
    const installationProfit = installationPrice || 0; // 100% profit on installation
    const totalProfit = productProfit + serviceProfit + installationProfit;

    // Insert the order
    const result = await sql`
      WITH service_check AS (
        SELECT EXISTS (
          SELECT 1 FROM products 
          WHERE id = ANY(${products.map((p: any) => p.id)}::int[])
          AND (category = 'Services' OR is_service = true)
        ) as has_services
      )
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
        status,
        contains_services,
        product_subtotal,
        service_subtotal,
        tax_amount,
        total_profit
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
        ${total},
        ${installationPrice},
        ${signature},
        'pending',
        (SELECT has_services FROM service_check),
        ${productSubtotal},
        ${serviceSubtotal},
        ${tax},
        ${totalProfit}
      ) RETURNING id
    `;

    const orderId = result.rows[0].id;

    // Insert order items
    for (const product of products) {
      const isService = product.category === 'Services' || 
                       product.category === 'Services/Custom' || 
                       product.is_service || 
                       product.is_custom;
      
      await sql`
        INSERT INTO OrderItems (
          order_id,
          product_id,
          quantity,
          price_at_time,
          cost_at_time
        ) VALUES (
          ${orderId},
          ${product.id},
          ${product.quantity},
          ${product.our_price || product.price},
          ${isService ? 0 : (product.price || product.our_price || 0)}
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '7d';
    
    let daysAgo;
    switch (period) {
      case '1d':
        daysAgo = 1;
        break;
      case '30d':
        daysAgo = 30;
        break;
      case '90d':
        daysAgo = 90;
        break;
      default:
        daysAgo = 7;
    }

    const { rows } = await sql.query(
      `SELECT 
        o.id,
        CONCAT(o.first_name, ' ', o.last_name) as customer_name,
        o.email,
        o.total_amount as total,
        o.status,
        o.created_at,
        json_agg(
          json_build_object(
            'title', p.title,
            'price', oi.price_at_time,
            'quantity', oi.quantity,
            'is_service', p.is_service
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.created_at >= NOW() - INTERVAL '${daysAgo} days'
      GROUP BY o.id, o.first_name, o.last_name, o.email, o.total_amount, o.status, o.created_at
      ORDER BY o.created_at DESC`
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}