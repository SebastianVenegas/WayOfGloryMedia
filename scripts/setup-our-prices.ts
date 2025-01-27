import { sql } from '@vercel/postgres'
import { readFileSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function setupOurPrices() {
  try {
    // Create our_prices table
    console.log('Creating our_prices table...')
    await sql`
      CREATE TABLE IF NOT EXISTS our_prices (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) UNIQUE NOT NULL,
        original_price DECIMAL(10,2) NOT NULL,
        our_price DECIMAL(10,2) NOT NULL,
        markup_percentage DECIMAL(5,2) NOT NULL DEFAULT 20.00,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log('Our prices table created successfully')

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
      DROP TRIGGER IF EXISTS update_our_prices_updated_at ON our_prices
    `

    await sql`
      CREATE TRIGGER update_our_prices_updated_at
          BEFORE UPDATE ON our_prices
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
    `

    // Insert our prices with 20% markup
    console.log('Populating our_prices with 20% markup...')
    await sql`
      INSERT INTO our_prices (product_id, original_price, our_price, markup_percentage)
      SELECT 
        id as product_id,
        price as original_price,
        ROUND(price * 1.20, 2) as our_price,
        20.00 as markup_percentage
      FROM products
      ON CONFLICT (product_id) 
      DO UPDATE SET 
        original_price = EXCLUDED.original_price,
        our_price = ROUND(EXCLUDED.original_price * 1.20, 2),
        updated_at = CURRENT_TIMESTAMP
    `

    // Verify the data
    const result = await sql`SELECT * FROM our_prices ORDER BY product_id`
    console.log('Our prices data:', result.rows)

  } catch (error) {
    console.error('Error setting up our_prices:', error)
    process.exit(1)
  }
}

setupOurPrices() 