import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import RegisterPageClient from "./register-client";

export const metadata = {
  title: "Registreren | BuurBak - Aanhanger Verhuur Platform",
  description: "Maak een gratis account aan bij BuurBak om aanhangers te huren of te verhuren in je buurt. Volledig verzekerd en veilig.",
};

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  // If already logged in, redirect to profile or home
  if (session) {
    redirect('/profiel');
  }

  return <RegisterPageClient />;
}