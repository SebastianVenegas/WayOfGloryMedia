const bcrypt = require('bcrypt')

async function generateHash() {
  const password = 'admin123'
  const saltRounds = 10
  const hash = await bcrypt.hash(password, saltRounds)
  console.log('Generated hash for password:', password)
  console.log('Hash:', hash)
}

generateHash() 