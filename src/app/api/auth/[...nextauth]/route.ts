import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Export a NextAuth handler with the configured options
const handler = NextAuth(authOptions);

// Export the handler methods for Next.js App Router
export { handler as GET, handler as POST };