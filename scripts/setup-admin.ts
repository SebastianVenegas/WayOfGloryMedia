import { sql } from '@vercel/postgres'
import bcrypt from 'bcrypt'

async function createAdminUser() {
  try {
    // Default admin credentials
    const email = 'admin@santisounds.com'
    const password = 'admin123' // You should change this immediately after first login
    const name = 'Admin'
    
    // Hash the password
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)
    
    // Check if admin user already exists
    const { rows: existingUsers } = await sql`
      SELECT * FROM admin_users WHERE email = ${email}
    `
    
    if (existingUsers.length > 0) {
      console.log('Admin user already exists')
      return
    }
    
    // Create admin user
    await sql`
      INSERT INTO admin_users (email, password_hash, name, role)
      VALUES (${email}, ${passwordHash}, ${name}, 'admin')
    `
    
    console.log('Admin user created successfully')
    console.log('Email:', email)
    console.log('Password:', password)
    console.log('Please change the password after first login')
    
  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    process.exit()
  }
}

createAdminUser() 