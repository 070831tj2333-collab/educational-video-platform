import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Redirect to login if not authenticated
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Role-based access control
    if (path.startsWith('/teacher') && token.role !== 'TEACHER') {
      return NextResponse.redirect(new URL('/student', req.url))
    }

    if (path.startsWith('/student') && token.role !== 'STUDENT') {
      return NextResponse.redirect(new URL('/teacher', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/teacher/:path*',
    '/student/:path*',
    '/feedback/:path*',
    '/api/courses/:path*',
    '/api/videos/:path*',
    '/api/worksheets/:path*',
    '/api/questions/:path*',
    '/api/notes/:path*',
    '/api/feedback/:path*',
  ],
}

