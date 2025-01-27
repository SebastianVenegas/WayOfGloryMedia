import { sql } from '@vercel/postgres'
import { readFileSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function setupProductImages() {
  try {
    // Create product_images table
    console.log('Creating product_images table...')
    await sql`
      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create index
    await sql`
      CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id)
    `

    // Create trigger for updated_at
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `

    await sql`
      DROP TRIGGER IF EXISTS update_product_images_updated_at ON product_images
    `

    await sql`
      CREATE TRIGGER update_product_images_updated_at
          BEFORE UPDATE ON product_images
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
    `

    console.log('Product images table and related objects created successfully')

  } catch (error) {
    console.error('Error setting up product_images:', error)
    process.exit(1)
  }
}

setupProductImages() 