// app/(pages)/plaatsen/page.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import OnePageTrailerForm from "@/components/add-trailer/one-page-trailer-form";

export const metadata = {
  title: "Plaats je aanhanger te huur | Aanhanger Verhuur Platform",
  description:
    "Plaats je aanhanger te huur op ons platform en begin met verhuren aan mensen in jouw buurt.",
};

export default async function AddTrailerPage() {
  const session = await getServerSession(authOptions);

  // If not logged in, redirect to the pre-auth landing page
  if (!session) {
    redirect('/verhuren');
  }

  return (
    <div className="bg-white min-h-screen">
      <OnePageTrailerForm />
    </div>
  );
}
