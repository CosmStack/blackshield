import { z } from 'zod'
import { createSignedCookie, readSecureCookie, validateServerInput } from '../src/server'
// Example using @cosmstack/blackshield/server - in real usage, import from the package
// For development, we use relative imports to the source

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function loginAction(formData: FormData) {
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  // Validate input
  const validation = validateServerInput(loginSchema, rawData)

  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors,
    }
  }

  // Authenticate user (your logic here)
  const user = await authenticateUser(validation.data)

  if (!user) {
    return {
      success: false,
      errors: { _root: ['Invalid credentials'] },
    }
  }

  // Create secure session cookie
  await createSignedCookie(
    'session',
    {
      userId: user.id,
      roles: user.roles,
    },
    {
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  )

  return {
    success: true,
    user,
  }
}

export async function getServerUser() {
  const session = await readSecureCookie<{ userId: string; roles: string[] }>('session')

  if (!session) {
    return null
  }

  // Fetch user from database
  return await getUserById(session.userId)
}

// Mock functions (implement with your auth system)
async function authenticateUser(data: { email: string; password: string }) {
  // Your authentication logic
  return { id: '123', email: data.email, roles: ['user'] }
}

async function getUserById(id: string) {
  // Your user fetching logic
  return { id, email: 'user@example.com', roles: ['user'] }
}
