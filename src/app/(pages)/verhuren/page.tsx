import StartRentingClient from "./start-renting-client";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: "Begin met verhuren - Verdien geld met je aanhanger | BuurBak",
  description:
    "Verhuur je aanhanger aan mensen in je buurt en verdien tot €50 per dag. Volledig verzekerd en veilig via BuurBak. Maak gratis een account aan.",
};

export default async function StartRentingPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/plaatsen");
  }

  return <StartRentingClient />;
}
