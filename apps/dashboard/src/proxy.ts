import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const token = request.cookies.get("pulseguard_token")?.value
  const { pathname } = request.nextUrl

  // Identify auth routes
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup")

  // Redirect unauthenticated user to login screen
  if (!token && !isAuthRoute) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated user to root if they try to access auth forms
  if (token && isAuthRoute) {
    const rootUrl = new URL("/", request.url)
    return NextResponse.redirect(rootUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo.svg (logo vector)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|logo.svg).*)",
  ],
}
