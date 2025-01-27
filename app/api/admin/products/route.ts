import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { verifyAuth } from '@/lib/auth'

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT 
        p.*,
        op.our_price
      FROM products p
      LEFT JOIN our_prices op ON p.id = op.product_id
      ORDER BY p.created_at DESC
    `
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.error()
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth()
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      title,
      description,
      price,
      category,
      image_url,
      features,
      technical_details,
      included_items,
      warranty_info,
      installation_available,
      images = []
    } = await request.json()

    if (!title || !price || !category) {
      return NextResponse.json(
        { error: 'Title, price, and category are required' },
        { status: 400 }
      )
    }

    const { rows } = await sql`
      WITH inserted_product AS (
        INSERT INTO products (
          title,
          description,
          price,
          category,
          image_url,
          features,
          technical_details,
          included_items,
          warranty_info,
          installation_available
        ) VALUES (
          ${title},
          ${description || null},
          ${price},
          ${category},
          ${image_url || null},
          ${features ? JSON.stringify(features) : null},
          ${technical_details ? JSON.stringify(technical_details) : null},
          ${included_items ? JSON.stringify(included_items) : null},
          ${warranty_info || null},
          ${installation_available || false}
        )
        RETURNING *
      ),
      inserted_price AS (
        INSERT INTO our_prices (product_id, original_price, our_price)
        SELECT 
          id,
          ${price},
          ROUND(${price} * 1.20, 2)
        FROM inserted_product
      ),
      inserted_images AS (
        INSERT INTO product_images (product_id, image_url, display_order)
        SELECT 
          p.id,
          url,
          ordinality - 1
        FROM inserted_product p
        CROSS JOIN unnest(${images}::text[]) WITH ORDINALITY as t(url)
        RETURNING *
      )
      SELECT 
        p.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pi.id,
              'image_url', pi.image_url,
              'display_order', pi.display_order
            ) ORDER BY pi.display_order
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'
        ) as images
      FROM inserted_product p
      LEFT JOIN inserted_images pi ON p.id = pi.product_id
      GROUP BY p.id
    `

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 