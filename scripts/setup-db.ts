const { sql } = require('@vercel/postgres')
const bcryptLib = require('bcrypt')
require('dotenv').config()

async function setupDatabase() {
  try {
    console.log('Creating admin_users table...')
    
    // Create admin_users table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log('✅ Admin users table created')

    console.log('Checking for existing admin user...')
    
    // Check if default admin exists
    const { rows } = await sql`
      SELECT * FROM admin_users WHERE email = 'admin@wayofglory.com'
    `

    if (rows.length === 0) {
      console.log('Creating default admin user...')
      // Create default admin user
      const passwordHash = await bcryptLib.hash('admin123', 10)
      await sql`
        INSERT INTO admin_users (email, password_hash, name, role)
        VALUES ('admin@wayofglory.com', ${passwordHash}, 'Admin User', 'admin')
      `
      console.log('✅ Created default admin user')
      console.log('Email: admin@wayofglory.com')
      console.log('Password: admin123')
    } else {
      console.log('✅ Admin user already exists')
    }

    console.log('Database setup completed successfully')
  } catch (error) {
    console.error('Error setting up database:', error)
    process.exit(1)
  }
}

setupDatabase() 