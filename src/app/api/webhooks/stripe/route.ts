import {prisma } from '@/lib/prisma'
import Stripe from 'stripe';

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log(`PaymentIntent canceled: ${paymentIntent.id}`);
  
  // Import the removeTemporaryBlock function only when needed
  // This prevents circular dependencies
  const { removeTemporaryBlock } = await import('@/lib/utils/temporary-block');
  
  // Find the payment and associated rental
  const payment = await prisma.payment.findFirst({
    where: { externalTransactionId: paymentIntent.id },
    include: { rental: true }
  });
  
  // First, remove any temporary blocks regardless of whether payment record exists
  try {
    const blockRemoved = await removeTemporaryBlock(paymentIntent.id);
    if (blockRemoved) {
      console.log(`Successfully removed temporary blocks for canceled payment intent ${paymentIntent.id} via webhook`);
    } else {
      console.log(`No temporary blocks found to remove for payment intent ${paymentIntent.id} via webhook`);
    }
  } catch (blockError) {
    console.error(`Error removing temporary blocks in webhook for payment intent ${paymentIntent.id}:`, blockError);
    // Continue with cancellation even if block removal fails
  }
  
  // If no payment record exists, we're done
  if (!payment) {
    console.log(`No payment record found for canceled intent: ${paymentIntent.id}`);
    return;
  }
  
  // Update payment status
  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'FAILED' }
  });
  
  // Cancel the rental
  await prisma.rental.update({
    where: { id: payment.rentalId },
    data: { 
      status: 'CANCELLED',
      cancellationReason: 'Payment canceled',
      cancellationDate: new Date()
    }
  });
  
  console.log(`Rental ${payment.rentalId} cancelled due to canceled payment ${paymentIntent.id}`);
}

async function handleAccountUpdated(account: Stripe.Account) {
  console.log(`Stripe Connect account updated: ${account.id}`);
  
  // Find the lessor associated with this Stripe account
  const user = await prisma.user.findFirst({
    where: { stripeAccountId: account.id }
  });
  
  if (!user) {
    console.log(`No user found for Stripe account: ${account.id}`);
    return;
  }
  
  // If account is now fully onboarded, update the user record
  if (account.details_submitted && account.charges_enabled) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // You might want to add fields to track onboarding status
        role: 'LESSOR' // Upgrade to lessor if not already
      }
    });
    
    // Notify the user their account is ready to receive payments
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'SYSTEM',
        message: 'Je Stripe account is volledig ingesteld. Je kunt nu betalingen ontvangen voor je verhuurde aanhangers.',
        actionUrl: '/dashboard'
      }
    });
  }
}

async function handleAccountAuthorized(account: Stripe.Account) {
  console.log(`Stripe Connect account authorized: ${account.id}`);
  
  // Similar to account.updated but specifically for authorization
  const user = await prisma.user.findFirst({
    where: { stripeAccountId: account.id }
  });
  
  if (!user) {
    console.log(`No user found for Stripe account: ${account.id}`);
    return;
  }
  
  // Create notification for the user
  await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'SYSTEM',
      message: 'Je Stripe account is geautoriseerd. Je kunt nu betalingen ontvangen als verhuurder.',
      actionUrl: '/dashboard'
    }
  });
}

async function handleAccountDeauthorized(account: Stripe.Account) {
  console.log(`Stripe Connect account deauthorized: ${account.id}`);
  
  // Find the user and update their account status
  const user = await prisma.user.findFirst({
    where: { stripeAccountId: account.id }
  });
  
  if (!user) {
    console.log(`No user found for Stripe account: ${account.id}`);
    return;
  }
  
  // Update user to indicate account is no longer connected
  await prisma.user.update({
    where: { id: user.id },
    data: {
      // You might want to clear or flag the stripeAccountId
      // stripeAccountId: null, // Only do this if you want to completely disconnect
    }
  });
  
  // Create notification for the user
  await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'SYSTEM',
      message: 'Je Stripe account is niet meer gekoppeld. Je kunt geen betalingen meer ontvangen totdat je het opnieuw instelt.',
      actionUrl: '/dashboard/settings/payments'
    }
  });
  
  // Also notify admin
  // You need to have an admin user ID
  const adminUsers = await prisma.user.findMany({
    where: { role: 'ADMIN' }
  });
  
  for (const admin of adminUsers) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: 'SYSTEM',
        message: `Verhuurder (${user.email}) heeft Stripe Connect gedeautoriseerd.`,
        actionUrl: `/admin/users/${user.id}`
      }
    });
  }
}

async function handleTransferCreated(transfer: Stripe.Transfer) {
  console.log(`Transfer created: ${transfer.id}`);
  
  // If you have metadata with the rental ID
  const rentalId = transfer.metadata?.rentalId;
  if (!rentalId) {
    console.log('Transfer does not have rental ID in metadata');
    return;
  }
  
  // Find the rental
  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    include: { lessor: true }
  });
  
  if (!rental) {
    console.log(`No rental found for ID: ${rentalId}`);
    return;
  }
  
  // Create a wallet transaction for the lessor
  await prisma.walletTransaction.create({
    data: {
      wallet: {
        connectOrCreate: {
          where: { userId: rental.lessorId },
          create: {
            userId: rental.lessorId,
            balance: transfer.amount / 100, // Convert cents to euros
            currency: 'EUR'
          }
        }
      },
      amount: transfer.amount / 100, // Convert cents to euros
      type: 'EARNING',
      description: `Inkomsten van verhuur #${rentalId}`,
      externalReference: transfer.id
    }
  });
  
  // Update wallet balance
  await prisma.wallet.updateMany({
    where: { userId: rental.lessorId },
    data: {
      balance: {
        increment: transfer.amount / 100 // Convert cents to euros
      }
    }
  });
  
  // Notify the lessor
  await prisma.notification.create({
    data: {
      userId: rental.lessorId,
      type: 'PAYMENT',
      message: `Je hebt €${(transfer.amount / 100).toFixed(2)} ontvangen voor verhuur #${rentalId}.`,
      actionUrl: '/dashboard/earnings'
    }
  });
}

async function handleTransferFailed(transfer: Stripe.Transfer) {
  console.log(`Transfer failed: ${transfer.id}`);
  
  // If you have metadata with the rental ID
  const rentalId = transfer.metadata?.rentalId;
  if (!rentalId) {
    console.log('Transfer does not have rental ID in metadata');
    return;
  }
  
  // Find the rental
  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    include: { lessor: true }
  });
  
  if (!rental) {
    console.log(`No rental found for ID: ${rentalId}`);
    return;
  }
  
  // Notify the lessor
  await prisma.notification.create({
    data: {
      userId: rental.lessorId,
      type: 'PAYMENT',
      message: `Er is een probleem opgetreden bij het uitbetalen van €${(transfer.amount / 100).toFixed(2)} voor verhuur #${rentalId}. Controleer je Stripe account instellingen.`,
      actionUrl: '/dashboard/settings/payments'
    }
  });
  
  // Notify admin
  const adminUsers = await prisma.user.findMany({
    where: { role: 'ADMIN' }
  });
  
  for (const admin of adminUsers) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: 'SYSTEM',
        message: `FOUT: Uitbetaling mislukt voor verhuur #${rentalId} (€${(transfer.amount / 100).toFixed(2)}).`,
        actionUrl: `/admin/rentals/${rentalId}`
      }
    });
  }
}

// Helper function to determine payment method type
function getPaymentMethodType(paymentIntent: Stripe.PaymentIntent): string {
  if (!paymentIntent.payment_method_types?.length) {
    return 'CARD'; // Default
  }
  
  // Extract the payment method type
  const paymentMethodType = paymentIntent.payment_method_types[0];
  
  // Map Stripe payment method types to your database enum values
  switch (paymentMethodType) {
    case 'card':
      return 'CARD';
    case 'ideal':
      return 'IDEAL';
    case 'bancontact':
      return 'BANCONTACT';
    case 'sofort':
      return 'SOFORT';
    case 'sepa_debit':
      return 'SEPA_DEBIT';
    default:
      return 'OTHER';
  }
}

// Helper function to check if two dates are the same day
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
  
  // Find the payment and associated rental
  const payment = await prisma.payment.findFirst({
    where: { externalTransactionId: paymentIntent.id },
    include: { rental: true }
  });
  
  if (!payment) {
    console.log(`No payment record found for payment intent: ${paymentIntent.id}`);
    return;
  }
  
  // Import the finalizeTemporaryBlock function only when needed
  // This prevents circular dependencies
  const { finalizeTemporaryBlock } = await import('@/lib/utils/temporary-block');
  
  // Update payment status
  await prisma.payment.update({
    where: { id: payment.id },
    data: { 
      status: 'COMPLETED',
      paymentDate: new Date(),
    }
  });
  
  // Update rental status to CONFIRMED
  await prisma.rental.update({
    where: { id: payment.rentalId },
    data: { status: 'CONFIRMED' }
  });
  
  // Finalize any temporary blocks for this payment intent
  try {
    const success = await finalizeTemporaryBlock(paymentIntent.id, payment.rentalId);
    if (success) {
      console.log(`Successfully finalized calendar blocks for rental ${payment.rentalId} via webhook`);
    } else {
      console.log(`No temporary blocks found to finalize for payment intent ${paymentIntent.id} via webhook`);
    }
  } catch (blockError) {
    console.error(`Error finalizing temporary blocks in webhook for payment intent ${paymentIntent.id}:`, blockError);
    // Continue with confirmation even if block finalization fails
  }
  
  // Send notifications to both parties
  await prisma.notification.create({
    data: {
      userId: payment.rental.renterId,
      type: 'BOOKING',
      message: 'Your reservation has been confirmed. Payment completed successfully.',
      actionUrl: `/rentals/${payment.rentalId}`
    }
  });
  
  await prisma.notification.create({
    data: {
      userId: payment.rental.lessorId,
      type: 'BOOKING',
      message: 'You have a new confirmed reservation.',
      actionUrl: `/rentals/${payment.rentalId}`
    }
  });
  
  console.log(`Rental ${payment.rentalId} confirmed after successful payment`);
}