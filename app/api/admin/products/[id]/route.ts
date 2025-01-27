import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { verifyAuth } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      WITH updated_product AS (
        UPDATE products 
        SET 
          title = ${title},
          description = ${description || null},
          price = ${price},
          category = ${category},
          image_url = ${image_url || null},
          features = ${features ? JSON.stringify(features) : null},
          technical_details = ${technical_details ? JSON.stringify(technical_details) : null},
          included_items = ${included_items ? JSON.stringify(included_items) : null},
          warranty_info = ${warranty_info || null},
          installation_available = ${installation_available || false},
          updated_at = NOW()
        WHERE id = ${params.id}
        RETURNING *
      ),
      updated_price AS (
        UPDATE our_prices
        SET 
          original_price = ${price},
          our_price = ROUND(${price} * 1.20, 2),
          updated_at = NOW()
        WHERE product_id = ${params.id}
      ),
      deleted_images AS (
        DELETE FROM product_images
        WHERE product_id = ${params.id}
      ),
      inserted_images AS (
        INSERT INTO product_images (product_id, image_url, display_order)
        SELECT 
          ${params.id}::integer,
          url,
          ordinality - 1
        FROM unnest(${images}::text[]) WITH ORDINALITY as t(url)
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
      FROM updated_product p
      LEFT JOIN inserted_images pi ON p.id = pi.product_id
      GROUP BY p.id
    `

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth()
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rows } = await sql`
      DELETE FROM products 
      WHERE id = ${params.id}
      RETURNING id
    `

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 