import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  const formData = await request.formData()
  const password = formData.get("password")
  // Use absolute URL for redirect
  const redirectUrl = new URL("/admin-audit-log", request.url);
  const response = NextResponse.redirect(redirectUrl)
  if (password === "admin123") {
    cookies().set("admin_auth", "admin123", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    })
  }
  return response
}
