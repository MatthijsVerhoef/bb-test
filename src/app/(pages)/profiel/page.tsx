import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import ProfileLoading from "@/components/profile/ProfileLoading";
import SimplifiedUserProfileDashboard from "@/components/profile/SimplifiedUserProfileDashboard";

interface ProfilePageProps {
  searchParams: Promise<{ tab?: string; mode?: string }>;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;

  const user = {
    id: session.user.id,
    email: session.user.email,
    firstName: session.user.firstName || null,
    lastName: session.user.lastName || null,
    phone: session.user.phone || null,
    address: session.user.address || null,
    city: session.user.city || null,
    postalCode: session.user.postalCode || null,
    country: session.user.country || null,
    profilePicture: null, // Add this to your session if needed
    isVerified: session.user.isVerified,
    role: session.user.role as "USER" | "LESSOR" | "ADMIN" | "SUPPORT",
  };

  return (
    <div className="px-3 md:px-0">
      <Suspense fallback={<ProfileLoading />}>
        <SimplifiedUserProfileDashboard
          user={user}
          initialActiveTab={params.tab}
          initialActiveMode={params.mode}
        />
      </Suspense>
    </div>
  );
}

export const revalidate = 3600;
export const dynamic = "force-dynamic";
