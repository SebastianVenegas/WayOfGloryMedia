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

    const data = await request.json() as ContractData;

    // Calculate amounts using our_price for products
    const subtotal = data.products.reduce((sum, item) => {
      return sum + (item.our_price * item.quantity);
    }, 0);

    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax + (data.installationPrice || 0);

    // Insert into contracts table
    const { rows } = await sql`
      INSERT INTO contracts (
        customer_name,
        customer_email,
        contract_type,
        status,
        details
      ) VALUES (
        ${data.firstName + ' ' + data.lastName},
        ${data.email},
        ${data.contract_type},
        ${data.status},
        ${JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          organization: data.organization,
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
          signatureUrl: data.signatureUrl,
          products: data.products,
          installationPrice: data.installationPrice,
          subtotal,
          tax,
          total
        })}
      ) RETURNING *
    `;

    return NextResponse.json({
      success: true,
      contract: rows[0]
    });
  } catch (error) {
    const dbError = error as ContractError;
    console.error('Database error:', dbError);
    return NextResponse.json(
      { error: dbError.message || 'Failed to create contract' },
      { status: 500 }
    );
  }
} 