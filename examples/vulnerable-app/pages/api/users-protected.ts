import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { protect } from '../../../../src/server'

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['user', 'admin']).default('user'),
})

// Mock database functions for example
async function getAllUsers() {
  return [
    { id: '1', email: 'user@example.com', name: 'John Doe', role: 'user' },
    { id: '2', email: 'admin@example.com', name: 'Jane Admin', role: 'admin' },
  ]
}

async function createUser(userData: z.infer<typeof createUserSchema>) {
  return { id: Date.now().toString(), ...userData }
}

async function deleteUser(id: string) {
  console.log(`Deleting user ${id}`)
}

const handler = protect(
  async (req: NextRequest, context) => {
    if (req.method === 'GET') {
      // ✅ Only return safe user data
      const users = await getAllUsers()
      const safeUsers = users.map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }))
      return NextResponse.json(safeUsers)
    }

    if (req.method === 'POST') {
      // ✅ Input is already validated by middleware
      const userData = context.validatedInput as z.infer<typeof createUserSchema>
      const user = await createUser(userData)
      return NextResponse.json(user)
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url)
      const id = url.searchParams.get('id')
      if (!id) {
        return NextResponse.json({ error: 'ID required' }, { status: 400 })
      }
      await deleteUser(id)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  },
  {
    // ✅ Require authentication
    requireAuth: true,
    // ✅ Rate limiting
    rateLimit: { max: 10, windowSeconds: 60 },
    // ✅ Input validation for POST requests
    schemaValidation: createUserSchema,
    // ✅ Role-based access for DELETE
    customAuth: (user, req) => {
      if (req.method === 'DELETE') {
        return user?.roles?.includes('admin') ?? false
      }
      return true
    },
  },
)

export default handler
