import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Constants for better maintainability
const PUBLIC_PATHS = {
  exact: new Set([
    "/",
    "/login",
    "/register",
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
  ]),
  prefixes: [
    "/aanbod/",
    "/blogs/",
    "/reserveren/",
    "/_next",
    "/images",
    "/api/auth/", 
    "/api/public/",
  ]
};

// Add verhuren as a special route that requires auth check
const AUTH_AWARE_PUBLIC_PATHS = new Set([
  "/verhuren"
]);

const ROLE_HIERARCHY = {
  ADMIN: 3,
  SUPPORT: 2,
  LESSOR: 1,
  USER: 0
};

const ROUTE_PERMISSIONS = {
  "/admin": ["ADMIN"],
  "/lessor-dashboard": ["LESSOR", "ADMIN"],
  "/support-dashboard": ["SUPPORT", "ADMIN"],
  "/dashboard": ["USER", "LESSOR", "SUPPORT", "ADMIN"],
};

// Performance tracking
const requestTimings = new Map<string, number>();

// Token cache for performance
const tokenCache = new Map<string, { token: any; expires: number }>();
const CACHE_DURATION = 60 * 1000; // 1 minute

function isPublicPath(path: string): boolean {
  // Check exact matches
  if (PUBLIC_PATHS.exact.has(path)) return true;
  
  // Check if it's a static file
  if (path.includes(".") && !path.startsWith("/api/")) return true;
  
  // Check prefixes
  return PUBLIC_PATHS.prefixes.some(prefix => path.startsWith(prefix));
}

function isAuthAwarePublicPath(path: string): boolean {
  return AUTH_AWARE_PUBLIC_PATHS.has(path);
}

function hasRequiredRole(userRole: string, requiredRoles: string[]): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] ?? -1;
  
  for (const role of requiredRoles) {
    const requiredLevel = ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY] ?? -1;
    if (userLevel >= requiredLevel) return true;
  }
  
  return false;
}

async function getCachedToken(request: NextRequest) {
  const sessionToken = request.cookies.get('next-auth.session-token')?.value || 
                      request.cookies.get('__Secure-next-auth.session-token')?.value;
  
  if (!sessionToken) return null;
  
  // Check cache
  const cached = tokenCache.get(sessionToken);
  if (cached && cached.expires > Date.now()) {
    return cached.token;
  }
  
  // Get fresh token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET!,
  });
  
  // Cache it
  if (token) {
    tokenCache.set(sessionToken, {
      token,
      expires: Date.now() + CACHE_DURATION
    });
  }
  
  return token;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Store request start time
  requestTimings.set(requestId, startTime);

  // Create response handler to log performance
  const createResponse = (response: NextResponse) => {
    const duration = Date.now() - startTime;
    requestTimings.delete(requestId);
    
    // Add performance headers
    response.headers.set('X-Request-ID', requestId);
    response.headers.set('X-Response-Time', `${duration}ms`);
    response.headers.set('Server-Timing', `total;dur=${duration}`);
    
    return response;
  };

  // Handle /verhuren specially - redirect to /plaatsen if authenticated
  if (path === "/verhuren") {
    const token = await getCachedToken(request);
    if (token && token.isVerified) {
      // User is authenticated, redirect to /plaatsen
      return createResponse(NextResponse.redirect(new URL("/plaatsen", request.url)));
    }
    // Not authenticated, let them see the verhuren page
    return createResponse(NextResponse.next());
  }

  // Allow public paths (excluding auth-aware ones)
  if (isPublicPath(path) && !isAuthAwarePublicPath(path)) {
    return createResponse(NextResponse.next());
  }

  // Get token for protected routes
  const token = await getCachedToken(request);

  // Check authentication for protected routes
  if (!token) {
    // API routes should return 401
    if (path.startsWith("/api/")) {
      return createResponse(NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ));
    }
    
    // Redirect to login for protected pages
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnUrl", path);
    return createResponse(NextResponse.redirect(loginUrl));
  }

  // Check email verification for certain routes
  if (!token.isVerified && !path.startsWith("/verify-email")) {
    const verifyUrl = new URL("/verify-email-sent", request.url);
    return createResponse(NextResponse.redirect(verifyUrl));
  }

  // Check role-based access
  for (const [route, roles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (path.startsWith(route)) {
      if (!hasRequiredRole(token.role as string, roles)) {
        return createResponse(NextResponse.redirect(new URL("/", request.url)));
      }
    }
  }

  // Add user info and performance tracking to headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", token.id as string);
  requestHeaders.set("x-user-role", token.role as string);
  requestHeaders.set("x-request-id", requestId);
  requestHeaders.set("x-request-start", startTime.toString());

  return createResponse(NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  }));
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};