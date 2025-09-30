import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  // Clear the admin_auth cookie so next visit will require password
  const response = NextResponse.redirect(new URL('/', request.url))
  response.cookies.set("admin_auth", "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
  })
  return response
}

// Support GET logout (some browsers or links may trigger GET). Avoids HTTP 405.
export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/', request.url))
  response.cookies.set("admin_auth", "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
  })
  return response
}
