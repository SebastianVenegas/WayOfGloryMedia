import { sql } from '@vercel/postgres'
import { readFileSync } from 'fs'
import { join } from 'path'

async function setupDatabase() {
  try {
    // Read schema and seed files
    const schemaSQL = readFileSync(join(process.cwd(), 'db', 'schema.sql'), 'utf8')
    const seedSQL = readFileSync(join(process.cwd(), 'db', 'seed.sql'), 'utf8')

    console.log('Creating database tables...')
    await sql.query(schemaSQL)
    console.log('Database tables created successfully')

    console.log('Seeding initial data...')
    await sql.query(seedSQL)
    console.log('Initial data seeded successfully')

    console.log('Database setup completed')
  } catch (error) {
    console.error('Error setting up database:', error)
    process.exit(1)
  }
}

setupDatabase() 