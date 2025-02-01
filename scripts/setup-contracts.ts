import { sql } from '@vercel/postgres'
import { readFileSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function setupContracts() {
  try {
    console.log('Setting up contracts table...')
    
    // Read and execute the migration file
    const migration = readFileSync(
      join(process.cwd(), 'migrations', 'create_contracts_table.sql'),
      'utf8'
    )
    
    await sql.query(migration)
    
    console.log('✅ Contracts table created successfully')
    
  } catch (error) {
    console.error('Error setting up contracts table:', error)
    process.exit(1)
  }
}

setupContracts() 