
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    const {rating, email, improvement, wouldRentAgain} = await request.json();

    await prisma.platformFeedback.create({
        data: {
            rating: rating,
            email: email,
            improvement: improvement,
            wouldRentAgain: wouldRentAgain
        }
    })

    return new Response(JSON.stringify({success: true}), {
        status: 200,
        headers: {"Content-Type": "application/json"}
    })
}

export async function GET() {
    try {
        const feedback = await prisma.platformFeedback.findMany();

        return new Response(JSON.stringify(feedback), {
            status: 200,
            headers: {"Content-Type": "application/json"}
        })   
    } catch(error) {
        console.error("Error while fetching feedback", error)
        return new Response(JSON.stringify({error: "Internal server error"}), {
            status: 500,
            headers: {"Content-Type": "application/json"}
        })
    }
}
