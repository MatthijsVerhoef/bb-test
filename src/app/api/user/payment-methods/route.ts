// app/api/user/payment-methods/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import { z } from "zod";

// Define validation schema for payment method creation
const paymentMethodSchema = z.object({
  cardholderName: z.string().min(1, "Cardholder name is required"),
  cardNumber: z.string().min(16, "Card number is required").max(19),
  expiryMonth: z.string().min(1, "Expiry month is required"),
  expiryYear: z.string().min(1, "Expiry year is required"),
  cvv: z.string().min(3, "CVV is required").max(4),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In a real application, you'd likely fetch this from a payment processor
    // like Stripe or from your database if you store tokenized payment methods

    // For demo purposes, we'll return mock payment methods
    const mockPaymentMethods = [
      {
        id: "pm_1234567890",
        cardType: "Visa",
        cardNumber: "4242424242424242",
        expiryMonth: "12",
        expiryYear: "2025",
        cardholderName: "John Doe",
        isDefault: true,
      },
      {
        id: "pm_0987654321",
        cardType: "Mastercard",
        cardNumber: "5555555555554444",
        expiryMonth: "10",
        expiryYear: "2024",
        cardholderName: "John Doe",
        isDefault: false,
      },
    ];

    return NextResponse.json(mockPaymentMethods);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json(
      { error: "Error fetching payment methods" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validationResult = paymentMethodSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { cardholderName, cardNumber, expiryMonth, expiryYear } =
      validationResult.data;

    // In a real app, you would:
    // 1. Never store full card numbers - tokenize via a payment processor
    // 2. Use a payment processor API like Stripe to create a payment method
    // 3. Store only the payment method ID and minimal information in your database

    // For demo purposes, we'll return a mock payment method
    const mockPaymentMethod = {
      id: `pm_${Date.now()}`,
      cardType: getCardType(cardNumber),
      cardNumber,
      expiryMonth,
      expiryYear,
      cardholderName,
      isDefault: false,
    };

    return NextResponse.json(mockPaymentMethod);
  } catch (error) {
    console.error("Error adding payment method:", error);
    return NextResponse.json(
      { error: "Error adding payment method" },
      { status: 500 }
    );
  }
}

// Helper function to determine card type based on card number
function getCardType(cardNumber: string) {
  const firstDigit = cardNumber.charAt(0);
  const firstTwoDigits = cardNumber.substring(0, 2);

  if (firstDigit === "4") return "Visa";
  if (["51", "52", "53", "54", "55"].includes(firstTwoDigits))
    return "Mastercard";
  if (["34", "37"].includes(firstTwoDigits)) return "American Express";
  if (["60", "65"].includes(firstTwoDigits)) return "Discover";

  return "Unknown";
}

// app/api/user/payment-methods/[id]/route.ts
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Payment method ID is required" },
        { status: 400 }
      );
    }

    // In a real app, you would:
    // 1. Check if this payment method belongs to the authenticated user
    // 2. Delete the payment method from your payment processor
    // 3. Remove the payment method record from your database

    // For demo purposes, we'll just return success
    return NextResponse.json({
      message: "Payment method deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    return NextResponse.json(
      { error: "Error deleting payment method" },
      { status: 500 }
    );
  }
}

// app/api/user/payment-methods/[id]/default/route.ts
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Payment method ID is required" },
        { status: 400 }
      );
    }

    // In a real app, you would:
    // 1. Check if this payment method belongs to the authenticated user
    // 2. Update your database to mark this payment method as default
    // 3. Unmark any other payment method as default

    // For demo purposes, we'll just return success
    return NextResponse.json({
      message: "Default payment method updated successfully",
    });
  } catch (error) {
    console.error("Error updating default payment method:", error);
    return NextResponse.json(
      { error: "Error updating default payment method" },
      { status: 500 }
    );
  }
}
