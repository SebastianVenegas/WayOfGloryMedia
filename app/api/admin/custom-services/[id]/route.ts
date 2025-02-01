import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { verifyAuth } from '@/lib/auth';

// Define a type for the context parameter that Next.js expects.
// Using Record<string, string> lets us accept any named dynamic segment.
interface RouteHandlerContext {
  params: Record<string, string>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteHandlerContext
) {
  const id = params.id;
  try {
    const result = await sql`
      SELECT * FROM custom_services 
      WHERE id = ${id}
    `;
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Custom service not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching custom service:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom service' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteHandlerContext
) {
  const id = params.id;
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const { title, description, price, features } = await request.json();
    const result = await sql`
      UPDATE custom_services 
      SET 
        title = ${title},
        description = ${description},
        price = ${price},
        features = ${features},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Custom service not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating custom service:', error);
    return NextResponse.json(
      { error: 'Failed to update custom service' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteHandlerContext
) {
  const id = params.id;
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const result = await sql`
      UPDATE custom_services 
      SET is_active = false 
      WHERE id = ${id}
      RETURNING *
    `;
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Custom service not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error deleting custom service:', error);
    return NextResponse.json(
      { error: 'Failed to delete custom service' },
      { status: 500 }
    );
  }
}

// This empty export ensures that TypeScript treats the file as a module.
export {};