// INTENTIONALLY VULNERABLE - DO NOT USE IN PRODUCTION
import type { NextApiRequest, NextApiResponse } from 'next'

// ❌ No authentication or authorization
// ❌ No input validation
// ❌ No rate limiting
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // ❌ Exposing all user data without filtering
    const users = await getAllUsers()
    return res.json(users)
  }

  if (req.method === 'POST') {
    // ❌ No validation of input data
    const userData = req.body
    const user = await createUser(userData)
    return res.json(user)
  }

  if (req.method === 'DELETE') {
    // ❌ Anyone can delete any user
    const { id } = req.query
    await deleteUser(id as string)
    return res.json({ success: true })
  }
}

// Mock functions
async function getAllUsers() {
  return [
    { id: 1, email: 'admin@example.com', password: 'admin123', role: 'admin' },
    { id: 2, email: 'user@example.com', password: 'user123', role: 'user' },
  ]
}

async function createUser(data: any) {
  return { id: Date.now(), ...data }
}

async function deleteUser(id: string) {
  console.log(`Deleting user ${id}`)
}
