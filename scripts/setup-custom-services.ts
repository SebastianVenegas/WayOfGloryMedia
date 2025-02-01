import { sql } from '@vercel/postgres'
import { readFileSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function setupCustomServices() {
  try {
    console.log('Setting up custom services table...')
    
    // Read and execute the migration file
    const migration = readFileSync(
      join(process.cwd(), 'migrations', 'create_custom_services_table.sql'),
      'utf8'
    )
    
    await sql.query(migration)
    
    console.log('✅ Custom services table created successfully')
    
  } catch (error) {
    console.error('Error setting up custom services table:', error)
    process.exit(1)
  }
}

setupCustomServices() 