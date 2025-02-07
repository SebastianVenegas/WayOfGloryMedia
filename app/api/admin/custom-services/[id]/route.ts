import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { verifyAuth } from '@/lib/auth';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const serviceId = Number(url.pathname.split('/').slice(-2, -1)[0]);

    if (isNaN(serviceId) || serviceId <= 0) {
      return NextResponse.json({ error: "Invalid service ID" }, { status: 400 });
    }

    const result = await sql`
      SELECT * FROM products 
      WHERE id = ${serviceId}
      AND is_custom = true
    `;
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Custom service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching custom service:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom service" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const serviceId = Number(url.pathname.split('/').slice(-2, -1)[0]);

    if (isNaN(serviceId) || serviceId <= 0) {
      return NextResponse.json({ error: "Invalid service ID" }, { status: 400 });
    }

    const auth = await verifyAuth(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, price, features } = body;
    const userEmail = request.headers.get('user-email');

    // Validation
    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!price || price <= 0) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
    }

    const featuresJson = features ? JSON.stringify(features) : '[]';

    const result = await sql`
      UPDATE products 
      SET 
        title = ${title},
        description = ${description || ''},
        price = ${price},
        features = ${featuresJson}::jsonb,
        updated_at = NOW(),
        updated_by = ${userEmail || 'unknown'}
      WHERE id = ${serviceId}
      AND is_custom = true
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Custom service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating custom service:", error);
    return NextResponse.json(
      { error: "Failed to update custom service" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const serviceId = Number(url.pathname.split('/').slice(-2, -1)[0]);

    if (isNaN(serviceId) || serviceId <= 0) {
      return NextResponse.json({ error: "Invalid service ID" }, { status: 400 });
    }

    const auth = await verifyAuth(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await sql`
      UPDATE products 
      SET 
        status = 'inactive',
        updated_at = NOW(),
        updated_by = ${request.headers.get('user-email') || 'unknown'}
      WHERE id = ${serviceId}
      AND is_custom = true
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Custom service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "Custom service deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting custom service:", error);
    return NextResponse.json(
      { error: "Failed to delete custom service" },
      { status: 500 }
    );
  }
} 