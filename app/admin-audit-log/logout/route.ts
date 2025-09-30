import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  // Clear the admin_auth cookie so next visit will require password
  const response = NextResponse.redirect(new URL('/', request.url))
  cookies().set("admin_auth", "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
  })
  return response
}
