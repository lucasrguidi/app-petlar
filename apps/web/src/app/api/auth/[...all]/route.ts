import { auth } from '@app-petlar/auth'
import { toNextJsHandler } from 'better-auth/next-js'
import { NextResponse, type NextRequest } from 'next/server'

const authHandler = toNextJsHandler(auth.handler)

export const GET = authHandler.GET

export async function POST(request: NextRequest) {
  // Invite-only onboarding: block direct public email sign-up endpoint.
  if (request.nextUrl.pathname.endsWith('/sign-up/email')) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 })
  }

  return authHandler.POST(request)
}
