import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT 
        o.*,
        COALESCE(
          json_agg(
            CASE WHEN oi.id IS NOT NULL THEN
              json_build_object(
                'id', oi.id,
                'product_id', oi.product_id,
                'quantity', oi.quantity,
                'price_at_time', oi.price_at_time,
                'cost_at_time', oi.cost_at_time,
                'product', json_build_object(
                  'id', p.id,
                  'title', p.title,
                  'description', p.description,
                  'category', p.category,
                  'is_service', p.is_service,
                  'features', p.features,
                  'technical_details', p.technical_details,
                  'included_items', p.included_items,
                  'warranty_info', p.warranty_info,
                  'installation_available', p.installation_available
                )
              )
            ELSE NULL END
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) as order_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `

    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
} 