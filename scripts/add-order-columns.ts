import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function addOrderColumns() {
  try {
    // Add new columns to orders table
    await sql`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS product_subtotal DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS service_subtotal DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_profit DECIMAL(10,2) DEFAULT 0;
    `;

    console.log('Successfully added new columns to orders table');
  } catch (error) {
    console.error('Error adding columns to orders table:', error);
    throw error;
  }
}

addOrderColumns()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 