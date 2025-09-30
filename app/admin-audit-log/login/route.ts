import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  const formData = await request.formData()
  const password = String(formData.get("password") ?? "")

  // Read admin password from env, fallback to the demo password
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"

  // Use absolute URL for redirect
  const redirectUrl = new URL("/admin-audit-log", request.url);
  const response = NextResponse.redirect(redirectUrl)

  if (password === ADMIN_PASSWORD) {
    // Set a short token (do not store the password directly) on the response so
    // the Set-Cookie header is included with the redirect.
    response.cookies.set("admin_auth", "1", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      // session cookie - removed when browser closed; set maxAge if you want persistence
    })
  } else {
    // Ensure cookie is cleared on failed login
    response.cookies.set("admin_auth", "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 0,
    })
  }

  return response
}
