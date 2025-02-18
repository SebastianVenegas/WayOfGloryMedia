import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { sendContractEmail } from '@/lib/email'

const TAX_RATE = 0.0775; // 7.75% for Riverside, CA

interface ContractData {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organization: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingInstructions?: string;
  installationAddress: string;
  installationCity: string;
  installationState: string;
  installationZip: string;
  installationDate: string;
  installationTime: string;
  accessInstructions?: string;
  contactOnSite: string;
  contactOnSitePhone: string;
  paymentMethod: string;
  signatureUrl?: string;
  products: Array<{
    id: number;
    quantity: number;
    our_price: number;
    price: number;
  }>;
  installationPrice: number;
  contract_type: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  details: {
    [key: string]: string | number | boolean;
  };
  contractNumber: string;
}

interface ContractError {
  code: string;
  message: string;
}

export async function GET() {
  try {
    const { rows } = await sql`SELECT * FROM contracts ORDER BY created_at DESC`;
    return NextResponse.json(rows);
  } catch (error) {
    const dbError = error as ContractError;
    console.error('Database error:', dbError);
    return NextResponse.json(
      { error: dbError.message || 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate request
    if (!request.body) {
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Calculate amounts using our_price for products, falling back to price
    const { productSubtotal, serviceSubtotal } = data.products.reduce((acc: any, item: any) => {
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
    const tax = productSubtotal * TAX_RATE;
    const total = productSubtotal + serviceSubtotal + tax + (data.installationPrice || 0);

    // Calculate profits
    const productProfit = productSubtotal * 0.2155; // 21.55% profit on products
    const serviceProfit = serviceSubtotal; // 100% profit on services
    const installationProfit = data.installationPrice || 0; // 100% profit on installation
    const totalProfit = productProfit + serviceProfit + installationProfit;

    // Insert into orders table
    const { rows } = await sql`
      WITH service_check AS (
        SELECT EXISTS (
          SELECT 1 FROM products 
          WHERE id = ANY(${data.products.map((p: any) => p.id.toString())}::int[])
          AND (category = 'Services' OR is_service = true)
        ) as has_services
      )
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
        status,
        contains_services,
        product_subtotal,
        service_subtotal,
        tax_amount,
        total_profit,
        contract_number
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
        ${total},
        ${data.installationPrice},
        ${data.signature},
        'pending',
        (SELECT has_services FROM service_check),
        ${productSubtotal},
        ${serviceSubtotal},
        ${tax},
        ${totalProfit},
        ${data.contractNumber}
      ) RETURNING id`;

    const orderId = rows[0].id;

    // Insert order items
    for (const product of data.products) {
      const isService = product.category === 'Services' || 
                       product.category === 'Services/Custom' || 
                       product.is_service || 
                       product.is_custom;
      
      await sql`
        INSERT INTO order_items (
          order_id,
          product_id,
          quantity,
          price_at_time,
          cost_at_time
        ) VALUES (
          ${orderId},
          ${product.id.toString()},
          ${product.quantity},
          ${product.our_price || product.price},
          ${isService ? 0 : (product.price || product.our_price || 0)}
        )
      `;
    }

    // Send confirmation email
    await sendContractEmail({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      organization: data.organization,
      orderId,
      orderItems: data.products.map((p: any) => ({
        product: { title: p.title },
        quantity: p.quantity,
        price_at_time: p.our_price || p.price
      })),
      totalAmount: total,
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
      signature_url: data.signature,
      taxAmount: tax
    });

    return NextResponse.json({
      success: true,
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