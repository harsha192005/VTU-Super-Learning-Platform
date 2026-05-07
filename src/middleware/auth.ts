import { Context, Next } from 'hono'

const JWT_SECRET = 'vtu-super-platform-secret-2024'

// Simple JWT implementation without external dependencies
function base64urlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return atob(str)
}

function base64urlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export async function signJWT(payload: object, secret: string = JWT_SECRET): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = base64urlEncode(JSON.stringify(header))
  const encodedPayload = base64urlEncode(JSON.stringify(payload))
  const data = `${encodedHeader}.${encodedPayload}`
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  const encodedSig = base64urlEncode(String.fromCharCode(...new Uint8Array(signature)))
  return `${data}.${encodedSig}`
}

export async function verifyJWT(token: string, secret: string = JWT_SECRET): Promise<any> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid token')
  const [encodedHeader, encodedPayload, encodedSig] = parts
  const data = `${encodedHeader}.${encodedPayload}`
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
  )
  const sigBytes = Uint8Array.from(base64urlDecode(encodedSig), c => c.charCodeAt(0))
  const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data))
  if (!valid) throw new Error('Invalid signature')
  const payload = JSON.parse(base64urlDecode(encodedPayload))
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired')
  return payload
}

// Simple password hashing using SHA-256 (for demo; use bcrypt in production)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'vtu-salt-2024')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const hashedInput = await hashPassword(password)
  return hashedInput === hash
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401)
  }
  const token = authHeader.slice(7)
  try {
    const payload = await verifyJWT(token)
    c.set('user', payload)
    await next()
  } catch {
    return c.json({ error: 'Unauthorized - Invalid token' }, 401)
  }
}

export async function adminMiddleware(c: Context, next: Next) {
  await authMiddleware(c, async () => {
    const user = c.get('user')
    if (user?.role !== 'admin') {
      return c.json({ error: 'Forbidden - Admin access required' }, 403)
    }
    await next()
  })
}

export function optionalAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next()
  const token = authHeader.slice(7)
  return verifyJWT(token).then(payload => { c.set('user', payload); return next() }).catch(() => next())
}
