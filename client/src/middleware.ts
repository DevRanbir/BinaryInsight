import { NextResponse } from "next/server"
import { auth } from "@/auth"

export const middleware = auth((request) => {
  const pathname = request.nextUrl.pathname
  const isPublicPage = pathname === "/" || pathname === "/login"

  if (!request.auth && !isPublicPage) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
})

export default middleware

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
