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

    console.log('Creating email_logs table...')
    
    // Create email_logs table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS email_logs (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        subject VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        template_id VARCHAR(50),
        status VARCHAR(50) DEFAULT 'sent',
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `
    console.log('✅ Email logs table created')

    // Get admin users from environment variables
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : []
    const adminPasswords = process.env.ADMIN_PASSWORDS ? process.env.ADMIN_PASSWORDS.split(',') : []
    const adminNames = process.env.ADMIN_NAMES ? process.env.ADMIN_NAMES.split(',') : []

    if (adminEmails.length !== adminPasswords.length || adminEmails.length !== adminNames.length) {
      console.error('Error: Mismatch in admin credentials configuration')
      process.exit(1)
    }

    console.log('Adding admin users...')
    for (let i = 0; i < adminEmails.length; i++) {
      const email = adminEmails[i].trim()
      const password = adminPasswords[i].trim()
      const name = adminNames[i].trim()

      // Check if user already exists
      const { rows } = await sql`
        SELECT * FROM admin_users WHERE email = ${email.toLowerCase()}
      `
      
      if (rows.length === 0) {
        // Create new admin user
        const passwordHash = await bcryptLib.hash(password, 10)
        await sql`
          INSERT INTO admin_users (email, password_hash, name, role)
          VALUES (${email.toLowerCase()}, ${passwordHash}, ${name}, 'admin')
        `
        console.log(`✅ Created admin user: ${email}`)
      } else {
        // Update existing user's password
        const passwordHash = await bcryptLib.hash(password, 10)
        await sql`
          UPDATE admin_users 
          SET password_hash = ${passwordHash},
              name = ${name},
              updated_at = CURRENT_TIMESTAMP
          WHERE email = ${email.toLowerCase()}
        `
        console.log(`Updated admin user: ${email}`)
      }
    }

    console.log('Database setup completed successfully')
  } catch (error) {
    console.error('Error setting up database:', error)
    process.exit(1)
  }
}

setupDatabase() 