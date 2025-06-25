import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LoginPageClient from "./login-client";

export const metadata = {
  title: "Inloggen | BuurBak - Aanhanger Verhuur Platform",
  description: "Log in op BuurBak om je aanhangers te beheren, boekingen te bekijken en te communiceren met huurders en verhuurders.",
};

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  // If already logged in, redirect to profile or home
  if (session) {
    redirect('/profiel');
  }

  return <LoginPageClient />;
}