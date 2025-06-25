// src/lib/auth.ts - Optimized version
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  // Core configuration
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  
  // Providers (unchanged)
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      },
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          firstName: profile.given_name,
          lastName: profile.family_name,
          role: "USER",
          isVerified: true,
          image: profile.picture,
        }
      },
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID || "",
      clientSecret: process.env.APPLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "name email"
        }
      },
      profile(profile) {
        const firstName = profile.name?.firstName || "";
        const lastName = profile.name?.lastName || "";
        
        return {
          id: profile.sub,
          email: profile.email,
          firstName: firstName,
          lastName: lastName,
          role: "USER",
          isVerified: true,
        }
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Only log in development and only essential info
        if (process.env.NODE_ENV === 'development') {
          console.log("Auth attempt for:", credentials?.email);
        }

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.isVerified) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          return null;
        }

        // Update last login timestamp
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLogin: new Date(),
            lastActive: new Date()
          }
        });

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isVerified: user.isVerified
        };
      }
    })
  ],

  // Session and JWT configuration
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // OPTIMIZED callbacks with minimal logging and database calls
  callbacks: {
    async jwt({ token, user, account, profile, trigger }) {
      // Only log significant events in development
      if (process.env.NODE_ENV === 'development' && user) {
        console.log("JWT: User login -", user.email);
      }

      // Add user data to token on initial login
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.email = user.email;
        token.isVerified = user.isVerified;
        
        // Check if this is a full user object with profile data
        if ('phone' in user || 'address' in user || 'city' in user) {
          token.profile = {
            phone: user.phone,
            address: user.address,
            city: user.city,
            postalCode: user.postalCode,
            country: user.country,
            bio: user.bio
          };
        }
        
        return token; // Early return to avoid unnecessary processing
      }
      
      // Handle NEW OAuth users only (not on every token refresh)
      if (account && account.type === "oauth" && !token.id) {
        try {
          let dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
          });
          
          if (!dbUser) {
            // Create new user for social login
            dbUser = await prisma.user.create({
              data: {
                email: token.email as string,
                firstName: token.firstName as string || "",
                lastName: token.lastName as string || "",
                role: "USER",
                isVerified: true,
                password: '',
                memberSince: new Date(),
              },
            });
          } else {
            // Update existing user login timestamp
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { 
                lastLogin: new Date(), 
                lastActive: new Date() 
              }
            });
          }
          
          // Update token with database user data
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.isVerified = dbUser.isVerified;
        } catch (error) {
          console.error("OAuth user creation/update failed:", error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      // No logging - this runs frequently
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.firstName = token.firstName as string | undefined;
        session.user.lastName = token.lastName as string | undefined;
        session.user.email = token.email as string;
        session.user.isVerified = token.isVerified as boolean;
        
        // Include extended profile data if available
        if (token.profile) {
          session.user.phone = token.profile.phone;
          session.user.address = token.profile.address;
          session.user.city = token.profile.city;
          session.user.postalCode = token.profile.postalCode;
          session.user.country = token.profile.country;
          session.user.bio = token.profile.bio;
        }
      }

      return session;
    }
  },

  // Custom pages
  pages: {
    signIn: "/login",
    error: "/auth-error",
    signOut: "/",
    newUser: "/profiel",
  },

  // SIMPLIFIED event logging - only log important events
  events: {
    async signIn({ user, account, isNewUser }) {
      // Only log in development or for new users
      if (process.env.NODE_ENV === 'development' || isNewUser) {
        console.log("SignIn:", user.email, "Provider:", account?.provider);
      }

      // Update login timestamp for social logins
      if (account?.provider !== 'credentials') {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLogin: new Date(),
            lastActive: new Date()
          }
        });
      }

      // Simplified login history (optional - remove if not needed)
      if (process.env.NODE_ENV === 'production') {
        await prisma.loginHistory.create({
          data: {
            userId: user.id,
            ipAddress: null,
            userAgent: null,
            successful: true
          }
        }).catch(() => {}); // Fail silently to avoid breaking auth
      }
    },
  },

  // Optimized cookie configuration
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60
      }
    }
  },

  // Theme (optional)
  theme: {
    colorScheme: "light",
    logo: "/logo.png",
  }
};

// Type declarations (unchanged)
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      role: string;
      isVerified: boolean;
      phone?: string;
      address?: string;
      city?: string;
      postalCode?: string;
      country?: string;
      bio?: string;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    firstName?: string;
    lastName?: string;
    email: string;
    isVerified: boolean;
    profile?: {
      phone?: string;
      address?: string;
      city?: string;
      postalCode?: string;
      country?: string;
      bio?: string;
    }
  }
}