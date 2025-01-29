import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const productId = Number(url.pathname.split('/').slice(-2, -1)[0]); // Extract ID from URL

    if (isNaN(productId) || productId <= 0) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const { name, price, description } = await request.json();

    if (!name || !price || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { rows } = await sql`
      UPDATE products
      SET name = ${name}, price = ${price}, description = ${description}
      WHERE id = ${productId}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}