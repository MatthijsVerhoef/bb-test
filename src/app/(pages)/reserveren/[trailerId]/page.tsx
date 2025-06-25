import ReservationClient from "@/components/reservation/check-reservation";
import { prisma } from "@/lib/prisma";

async function getTrailerData(id: string) {
  return prisma.trailer.findUnique({
    where: { id },
    include: {
      weeklyAvailability: true,
      owner: {
        select: {
          id: true,
        },
      },
      images: {
        take: 1,
        orderBy: {
          order: "asc",
        },
        select: {
          id: true,
          url: true,
          title: true,
          order: true,
        },
      },
      category: true,
      accessories: {
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
        },
      },
    },
  });
}

export default async function Page({ params }) {
  const { trailerId } = await params;
  const trailerData = await getTrailerData(trailerId);

  return <ReservationClient trailerId={trailerId} trailerData={trailerData} />;
}
