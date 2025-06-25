import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_EXACT_PATHS = new Set([
  "/",
  "/login", 
  "/register",
  "/verhuren",
  "/forgot-password",
  "/reset-password", 
  "/verify-email",
  "/verify-email-sent",
  "/terms",
  "/privacy", 
  "/faq",
  "/contact",
  "/about",
  "/help",
  "/how-it-works",
  "/blogs"
]);

const PUBLIC_WILDCARD_PATTERNS = [
  "/aanbod/",
  "/blogs/",
  "/reserveren/"
];

const ROLE_BASED_PATHS = {
  "/admin": ["ADMIN"],
  "/lessor-dashboard": ["LESSOR", "ADMIN"], 
  "/support-dashboard": ["SUPPORT", "ADMIN"],
};

const isPublicPath = (path: string): boolean => {
  if (PUBLIC_EXACT_PATHS.has(path)) {
    return true;
  }
  
  if (
    path.startsWith("/_next") ||
    path.startsWith("/images") ||
    path.startsWith("/api/") ||
    path.includes(".")
  ) {
    return true;
  }

  return PUBLIC_WILDCARD_PATTERNS.some(pattern => path.startsWith(pattern));
};

const hasRequiredRole = (user: any, path: string): boolean => {
  for (const [pattern, roles] of Object.entries(ROLE_BASED_PATHS)) {
    if (path.startsWith(pattern)) {
      return user?.role && roles.includes(user.role);
    }
  }
  return true;
};

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (isPublicPath(path)) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  if (!token) {
    if (path === "/plaatsen") {
      const verhuurenUrl = new URL("/verhuren", request.url);
      return NextResponse.redirect(verhuurenUrl);
    }
    
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!hasRequiredRole(token, path)) {
    const redirectUrl = token.role === "ADMIN"
      ? new URL("/admin", request.url)
      : token.role === "LESSOR" 
      ? new URL("/lessor-dashboard", request.url)
      : new URL("/dashboard", request.url);
    
    return NextResponse.redirect(redirectUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/plaatsen/:path*",
    "/dashboard/:path*",
    "/profiel/:path*", 
    "/admin/:path*",
    "/lessor-dashboard/:path*",
    "/support-dashboard/:path*",
    "/booking/:path*",
  ],
};