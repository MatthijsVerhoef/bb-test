// /lib/email.ts
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma'


// Configure transporter (use environment variables in production)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASSWORD || 'password',
  },
});

/**
 * Check if a user has enabled a specific notification setting
 * @param userId - The ID of the user
 * @param settingKey - The notification setting key to check
 * @returns A boolean indicating if the notification is enabled
 */
export async function isNotificationEnabled(userId: string, settingKey: string): Promise<boolean> {
  // Debug log for tracing
  console.log(`[DEBUG] Checking if notification is enabled for user ${userId}, setting ${settingKey}`);
  
  // Validate userId
  if (!userId) {
    console.error('[ERROR] isNotificationEnabled called with empty userId');
    // Default to true for important notifications if userId is missing
    return true;
  }
  
  try {
    // Check if user has email notifications enabled globally
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, emailNotifications: true }
    });

    // Debug log for user global setting
    console.log(`[DEBUG] User ${userId} global email notifications: ${user?.emailNotifications}`);

    if (!user || user.emailNotifications === false) {
      console.log(`[DEBUG] User ${userId} has globally disabled email notifications or not found`);
      return false;
    }

    // Check specific notification setting
    const setting = await prisma.notificationSetting.findUnique({
      where: {
        userId_settingKey: {
          userId: userId,
          settingKey: settingKey
        }
      }
    });

    // Debug log for specific setting
    if (setting) {
      console.log(`[DEBUG] User ${userId} has setting "${settingKey}" = ${setting.enabled}`);
    } else {
      console.log(`[DEBUG] User ${userId} has no specific setting for "${settingKey}", defaulting to true`);
    }

    // If setting doesn't exist, default to true (most notifications are on by default)
    const result = setting ? setting.enabled : true;
    console.log(`[DEBUG] Final notification check result: ${result ? 'ENABLED' : 'DISABLED'}`);
    return result;
  } catch (error) {
    console.error(`[ERROR] Error checking notification settings for user ${userId}:`, error);
    // Default to true in case of error to ensure important notifications are sent
    return true;
  }
}

// Helper function to format dates in Dutch format
const formatDate = (date: Date) => {
  return date.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// Standard email footer
const getEmailFooter = () => {
  return `
    <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
      <p>© ${new Date().getFullYear()} BuurBak. Alle rechten voorbehouden.</p>
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/voorwaarden" style="color: #666; text-decoration: underline;">Algemene Voorwaarden</a> |
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy" style="color: #666; text-decoration: underline;">Privacybeleid</a>
      </p>
    </div>
  `;
};

// Standard email header
const getEmailHeader = () => {
  return `
    <div style="background-color: #f5f5f5; padding: 20px; text-align: center;">
      <h1 style="margin: 0;"><span style="color: #ff6600;">Buur</span><span style="color: #4CAF50;">Bak</span></h1>
    </div>
  `;
};

/**
 * Send verification email to new users
 */
export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/?token=${token}`;
  
  const mailOptions = {
    from: `"BuurBak" <${process.env.SMTP_FROM || 'noreply@buurbak.nl'}>`,
    to: email,
    subject: 'Verifieer je e-mailadres',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        ${getEmailHeader()}
        <div style="padding: 20px;">
          <h2>Welkom bij BuurBak!</h2>
          <p>Bedankt voor je registratie. Verifieer je e-mailadres om verder te gaan:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #ff6600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verifieer e-mailadres</a>
          </div>
          <p>Of kopieer en plak deze link in je browser:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>Deze link verloopt over 24 uur.</p>
          <p>Als je je niet hebt geregistreerd bij BuurBak, kun je deze e-mail veilig negeren.</p>
        </div>
        ${getEmailFooter()}
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/?resetToken=${token}`;
  
  const mailOptions = {
    from: `"BuurBak" <${process.env.SMTP_FROM || 'noreply@buurbak.nl'}>`,
    to: email,
    subject: 'Wachtwoord resetten',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        ${getEmailHeader()}
        <div style="padding: 20px;">
          <h2>Wachtwoord resetten</h2>
          <p>We hebben een verzoek ontvangen om je wachtwoord te resetten. Klik op de onderstaande link om een nieuw wachtwoord in te stellen:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #ff6600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Wachtwoord resetten</a>
          </div>
          <p>Of kopieer en plak deze link in je browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>Deze link verloopt over 1 uur.</p>
          <p>Als je geen wachtwoord reset hebt aangevraagd, kun je deze e-mail veilig negeren.</p>
        </div>
        ${getEmailFooter()}
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

/**
 * Send welcome email after account verification
 */
export async function sendWelcomeEmail(email: string, firstName: string) {
    const mailOptions = {
      from: `"BuurBak" <${process.env.SMTP_FROM || 'noreply@buurbak.nl'}>`,
      to: email,
      subject: 'Welkom bij BuurBak!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${getEmailHeader()}
          <div style="padding: 20px;">
            <h2>Welkom bij BuurBak, ${firstName}!</h2>
            <p>Bedankt voor het verifiëren van je e-mailadres. Je account is nu actief en je kunt direct beginnen met het huren of verhuren van aanhangers.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/aanbod" style="background-color: #ff6600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Bekijk beschikbare aanhangers</a>
            </div>
            <p>Hier zijn een paar tips om te beginnen:</p>
            <ul>
              <li>Vul je profiel aan met meer informatie</li>
              <li>Voeg betaalmethodes toe voor snellere transacties</li>
              <li>Verken beschikbare aanhangers in je buurt</li>
              <li>Als je een aanhanger wilt verhuren, maak een advertentie aan via je dashboard</li>
            </ul>
            <p>Bij vragen kun je altijd contact opnemen met onze klantenservice.</p>
            <p>Veel plezier met BuurBak!</p>
          </div>
          ${getEmailFooter()}
        </div>
      `,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }
  
  /**
   * Send email notification for new bookings (to trailer owner)
   */
  export async function sendNewBookingEmail(
    ownerEmail: string,
    ownerName: string,
    trailerTitle: string,
    bookingDetails: {
      startDate: Date;
      endDate: Date;
      renterName: string;
      totalPrice: number;
      bookingId: string;
      ownerId: string;
    }
  ) {
    const { startDate, endDate, renterName, totalPrice, bookingId, ownerId } = bookingDetails;
    
    // Check if owner has enabled booking request notifications
    const isEnabled = await isNotificationEnabled(ownerId, 'bookings:booking_request');
    if (!isEnabled) {
      console.log(`Booking email notifications disabled for owner ${ownerName} (${ownerId})`);
      return false;
    }
    
    const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${bookingId}`;
  
    const mailOptions = {
      from: `"BuurBak" <${process.env.SMTP_FROM || 'noreply@buurbak.nl'}>`,
      to: ownerEmail,
      subject: 'Nieuwe reservering voor je aanhanger',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${getEmailHeader()}
          <div style="padding: 20px;">
            <h2>Nieuwe reservering!</h2>
            <p>Hallo ${ownerName},</p>
            <p>Goed nieuws! Je hebt een nieuwe reservering ontvangen voor je aanhanger "${trailerTitle}".</p>
            
            <div style="background-color: #f9f9f9; border-left: 4px solid #ff6600; padding: 15px; margin: 20px 0;">
              <p><strong>Reserveringsdetails:</strong></p>
              <ul style="list-style-type: none; padding-left: 0;">
                <li><strong>Huurder:</strong> ${renterName}</li>
                <li><strong>Ophaaldatum:</strong> ${formatDate(startDate)}</li>
                <li><strong>Retourdatum:</strong> ${formatDate(endDate)}</li>
                <li><strong>Totaalbedrag:</strong> €${totalPrice.toFixed(2)}</li>
              </ul>
            </div>
            
            <p>Je kunt de reservering bekijken en accepteren door op de onderstaande knop te klikken.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${bookingUrl}" style="background-color: #ff6600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Bekijk reservering</a>
            </div>
            
            <p>Je hebt 24 uur om de reservering te accepteren, anders wordt deze automatisch geannuleerd.</p>
            <p>Bij vragen kun je contact opnemen met onze klantenservice.</p>
          </div>
          ${getEmailFooter()}
        </div>
      `,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`New booking email sent to ${ownerEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending new booking email:', error);
      throw new Error('Failed to send new booking email');
    }
  }
  
  /**
   * Send email notification for booking confirmation (to renter)
   */
  export async function sendBookingConfirmationEmail(
    renterEmail: string,
    renterName: string,
    trailerTitle: string,
    bookingDetails: {
      startDate: Date;
      endDate: Date;
      ownerName: string;
      totalPrice: number;
      bookingId: string;
      pickupLocation: string;
      renterId: string;
    }
  ) {
    const { startDate, endDate, ownerName, totalPrice, bookingId, pickupLocation, renterId } = bookingDetails;
    
    console.log(`[DEBUG] sendBookingConfirmationEmail called for rental ${bookingId}, renter ${renterName} (${renterId})`);
    
    // Check if renter has enabled booking confirmation notifications
    const isEnabled = await isNotificationEnabled(renterId, 'bookings:booking_confirmed');
    if (!isEnabled) {
      console.log(`[INFO] Booking confirmation email notifications disabled for renter ${renterName} (${renterId})`);
      return false;
    }
    
    const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/profiel?tab=rentals&mode=renter`;
  
    const mailOptions = {
      from: `"BuurBak" <${process.env.SMTP_FROM || 'noreply@buurbak.nl'}>`,
      to: renterEmail,
      subject: 'Reservering bevestigd',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${getEmailHeader()}
          <div style="padding: 20px;">
            <h2>Je reservering is bevestigd!</h2>
            <p>Hallo ${renterName},</p>
            <p>Goed nieuws! Je reservering voor de aanhanger "${trailerTitle}" is bevestigd door de eigenaar.</p>
            
            <div style="background-color: #f9f9f9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
              <p><strong>Reserveringsdetails:</strong></p>
              <ul style="list-style-type: none; padding-left: 0;">
                <li><strong>Eigenaar:</strong> ${ownerName}</li>
                <li><strong>Ophaaldatum:</strong> ${formatDate(startDate)}</li>
                <li><strong>Retourdatum:</strong> ${formatDate(endDate)}</li>
                <li><strong>Ophaaladres:</strong> ${pickupLocation}</li>
                <li><strong>Totaalbedrag:</strong> €${totalPrice.toFixed(2)}</li>
              </ul>
            </div>
            
            <p>Je kunt alle details van je reservering bekijken door op de onderstaande knop te klikken.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${bookingUrl}" style="background-color: #ff6600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Bekijk reservering</a>
            </div>
            
            <p>Vergeet niet om op tijd aanwezig te zijn voor het ophalen van de aanhanger.</p>
            <p>Bij vragen kun je contact opnemen met de eigenaar of onze klantenservice.</p>
          </div>
          ${getEmailFooter()}
        </div>
      `,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Booking confirmation email sent to ${renterEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending booking confirmation email:', error);
      throw new Error('Failed to send booking confirmation email');
    }
  }
  
  /**
   * Send email notification for new reservation (to renter)
   */
  export async function sendNewReservationEmail(
    renterEmail: string,
    renterName: string,
    trailerTitle: string,
    bookingDetails: {
      startDate: Date;
      endDate: Date;
      ownerName: string;
      totalPrice: number;
      bookingId: string;
      pickupLocation?: string;
      renterId: string;
    }
  ) {
    const { startDate, endDate, ownerName, totalPrice, bookingId, pickupLocation, renterId } = bookingDetails;
    
    // Check if renter has enabled booking request notifications
    const isEnabled = await isNotificationEnabled(renterId, 'bookings:booking_request');
    if (!isEnabled) {
      console.log(`New reservation email notifications disabled for renter ${renterName} (${renterId})`);
      return false;
    }
    
    const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/profiel?tab=rentals&mode=renter`;
  
    const mailOptions = {
      from: `"BuurBak" <${process.env.SMTP_FROM || 'noreply@buurbak.nl'}>`,
      to: renterEmail,
      subject: 'Je reservering is aangemaakt',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${getEmailHeader()}
          <div style="padding: 20px;">
            <h2>Je reservering is aangemaakt!</h2>
            <p>Hallo ${renterName},</p>
            <p>Bedankt voor je reservering van de aanhanger "${trailerTitle}". Je reservering is aangemaakt en wacht op bevestiging van de eigenaar.</p>
            
            <div style="background-color: #f9f9f9; border-left: 4px solid #ff6600; padding: 15px; margin: 20px 0;">
              <p><strong>Reserveringsdetails:</strong></p>
              <ul style="list-style-type: none; padding-left: 0;">
                <li><strong>Eigenaar:</strong> ${ownerName}</li>
                <li><strong>Ophaaldatum:</strong> ${formatDate(startDate)}</li>
                <li><strong>Retourdatum:</strong> ${formatDate(endDate)}</li>
                ${pickupLocation ? `<li><strong>Ophaaladres:</strong> ${pickupLocation}</li>` : ''}
                <li><strong>Totaalbedrag:</strong> €${totalPrice.toFixed(2)}</li>
              </ul>
            </div>
            
            <p>Je kunt alle details van je reservering bekijken door op de onderstaande knop te klikken.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${bookingUrl}" style="background-color: #ff6600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Bekijk reservering</a>
            </div>
            
            <p>Je ontvangt een bevestigingsmail zodra de eigenaar je reservering heeft geaccepteerd.</p>
            <p>Bij vragen kun je contact opnemen met de eigenaar of onze klantenservice.</p>
          </div>
          ${getEmailFooter()}
        </div>
      `,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`New reservation email sent to ${renterEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending new reservation email:', error);
      throw new Error('Failed to send new reservation email');
    }
  }

  /**
   * Send email notification for booking cancellation (to renter)
   */
  export async function sendBookingCancelledEmail(
    renterEmail: string,
    renterName: string,
    trailerTitle: string,
    bookingDetails: {
      startDate: Date;
      endDate: Date;
      ownerName: string;
      totalPrice: number;
      bookingId: string;
      cancellationReason?: string;
      renterId: string;
    }
  ) {
    const { startDate, endDate, ownerName, totalPrice, bookingId, cancellationReason, renterId } = bookingDetails;
    
    console.log(`[DEBUG] sendBookingCancelledEmail called for rental ${bookingId}, renter ${renterName} (${renterId})`);
    
    // Check if renter has enabled booking cancellation notifications
    const isEnabled = await isNotificationEnabled(renterId, 'bookings:booking_cancelled');
    if (!isEnabled) {
      console.log(`[INFO] Booking cancellation email notifications disabled for renter ${renterName} (${renterId})`);
      return false;
    }
    
    const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/profiel?tab=rentals&mode=renter`;
  
    const mailOptions = {
      from: `"BuurBak" <${process.env.SMTP_FROM || 'noreply@buurbak.nl'}>`,
      to: renterEmail,
      subject: 'Je reservering is geannuleerd',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${getEmailHeader()}
          <div style="padding: 20px;">
            <h2>Je reservering is geannuleerd</h2>
            <p>Hallo ${renterName},</p>
            <p>Helaas moeten we je informeren dat je reservering voor de aanhanger "${trailerTitle}" is geannuleerd door de eigenaar.</p>
            
            <div style="background-color: #f9f9f9; border-left: 4px solid #ff6600; padding: 15px; margin: 20px 0;">
              <p><strong>Reserveringsdetails:</strong></p>
              <ul style="list-style-type: none; padding-left: 0;">
                <li><strong>Eigenaar:</strong> ${ownerName}</li>
                <li><strong>Ophaaldatum:</strong> ${formatDate(startDate)}</li>
                <li><strong>Retourdatum:</strong> ${formatDate(endDate)}</li>
                <li><strong>Totaalbedrag:</strong> €${totalPrice.toFixed(2)}</li>
                ${cancellationReason ? `<li><strong>Reden voor annulering:</strong> ${cancellationReason}</li>` : ''}
              </ul>
            </div>
            
            <p>Je kunt andere beschikbare aanhangers bekijken via de onderstaande knop.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/aanbod" style="background-color: #ff6600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Bekijk beschikbare aanhangers</a>
            </div>
            
            <p>Als je al een betaling hebt gedaan, zal deze automatisch worden teruggestort naar je rekening.</p>
            <p>Bij vragen kun je contact opnemen met onze klantenservice.</p>
          </div>
          ${getEmailFooter()}
        </div>
      `,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Booking cancelled email sent to ${renterEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending booking cancelled email:', error);
      throw new Error('Failed to send booking cancelled email');
    }
  }

  /**
   * Send email notification when a booking is modified (to renter)
   */
  export async function sendBookingModifiedEmail(
    renterEmail: string,
    renterName: string,
    trailerTitle: string,
    bookingDetails: {
      startDate: Date;
      endDate: Date;
      ownerName: string;
      totalPrice: number;
      bookingId: string;
      pickupLocation: string;
      oldStartDate?: Date;
      oldEndDate?: Date;
      oldTotalPrice?: number;
      renterId: string;
    }
  ) {
    const { 
      startDate, endDate, ownerName, totalPrice, 
      bookingId, pickupLocation, oldStartDate, oldEndDate, oldTotalPrice, renterId
    } = bookingDetails;
    
    // Check if renter has enabled booking modification notifications
    const isEnabled = await isNotificationEnabled(renterId, 'bookings:booking_modified');
    if (!isEnabled) {
      console.log(`Booking modification email notifications disabled for renter ${renterName} (${renterId})`);
      return false;
    }
    
    const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/profiel?tab=rentals&mode=renter`;
  
    const mailOptions = {
      from: `"BuurBak" <${process.env.SMTP_FROM || 'noreply@buurbak.nl'}>`,
      to: renterEmail,
      subject: 'Je reservering is gewijzigd',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${getEmailHeader()}
          <div style="padding: 20px;">
            <h2>Je reservering is gewijzigd</h2>
            <p>Hallo ${renterName},</p>
            <p>Je reservering voor de aanhanger "${trailerTitle}" is gewijzigd.</p>
            
            <div style="background-color: #f9f9f9; border-left: 4px solid #ff6600; padding: 15px; margin: 20px 0;">
              <p><strong>Nieuwe reserveringsdetails:</strong></p>
              <ul style="list-style-type: none; padding-left: 0;">
                <li><strong>Eigenaar:</strong> ${ownerName}</li>
                <li><strong>Ophaaldatum:</strong> ${formatDate(startDate)}</li>
                <li><strong>Retourdatum:</strong> ${formatDate(endDate)}</li>
                <li><strong>Ophaaladres:</strong> ${pickupLocation}</li>
                <li><strong>Totaalbedrag:</strong> €${totalPrice.toFixed(2)}</li>
              </ul>
              
              ${(oldStartDate || oldEndDate || oldTotalPrice) ? `
                <p><strong>Vorige details:</strong></p>
                <ul style="list-style-type: none; padding-left: 0;">
                  ${oldStartDate ? `<li><strong>Oude ophaaldatum:</strong> ${formatDate(oldStartDate)}</li>` : ''}
                  ${oldEndDate ? `<li><strong>Oude retourdatum:</strong> ${formatDate(oldEndDate)}</li>` : ''}
                  ${oldTotalPrice ? `<li><strong>Oud totaalbedrag:</strong> €${oldTotalPrice.toFixed(2)}</li>` : ''}
                </ul>
              ` : ''}
            </div>
            
            <p>Je kunt alle details van je reservering bekijken door op de onderstaande knop te klikken.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${bookingUrl}" style="background-color: #ff6600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Bekijk reservering</a>
            </div>
            
            <p>Bij vragen kun je contact opnemen met de eigenaar of onze klantenservice.</p>
          </div>
          ${getEmailFooter()}
        </div>
      `,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Booking modified email sent to ${renterEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending booking modified email:', error);
      throw new Error('Failed to send booking modified email');
    }
  }
  
  /**
   * Send email notification for booking cancellation (to owner)
   */
  export async function sendBookingCancelledToOwnerEmail(
    ownerEmail: string,
    ownerName: string,
    trailerTitle: string,
    bookingDetails: {
      startDate: Date;
      endDate: Date;
      renterName: string;
      totalPrice: number;
      bookingId: string;
      cancellationReason?: string;
      ownerId: string;
      cancelledByRenter: boolean;
    }
  ) {
    const { startDate, endDate, renterName, totalPrice, bookingId, cancellationReason, ownerId, cancelledByRenter } = bookingDetails;
    
    console.log(`[DEBUG] sendBookingCancelledToOwnerEmail called for rental ${bookingId}, owner ${ownerName} (${ownerId})`);
    
    // Check if owner has enabled booking cancellation notifications
    const isEnabled = await isNotificationEnabled(ownerId, 'bookings:booking_cancelled');
    if (!isEnabled) {
      console.log(`[INFO] Booking cancellation email notifications disabled for owner ${ownerName} (${ownerId})`);
      return false;
    }
    
    const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/profiel?tab=rentals&mode=lessor`;
  
    const mailOptions = {
      from: `"BuurBak" <${process.env.SMTP_FROM || 'noreply@buurbak.nl'}>`,
      to: ownerEmail,
      subject: 'Reservering is geannuleerd',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${getEmailHeader()}
          <div style="padding: 20px;">
            <h2>Reservering is geannuleerd</h2>
            <p>Hallo ${ownerName},</p>
            <p>Een reservering voor je aanhanger "${trailerTitle}" is ${cancelledByRenter ? 'geannuleerd door de huurder' : 'geannuleerd'}.</p>
            
            <div style="background-color: #f9f9f9; border-left: 4px solid #ff6600; padding: 15px; margin: 20px 0;">
              <p><strong>Reserveringsdetails:</strong></p>
              <ul style="list-style-type: none; padding-left: 0;">
                <li><strong>Huurder:</strong> ${renterName}</li>
                <li><strong>Ophaaldatum:</strong> ${formatDate(startDate)}</li>
                <li><strong>Retourdatum:</strong> ${formatDate(endDate)}</li>
                <li><strong>Totaalbedrag:</strong> €${totalPrice.toFixed(2)}</li>
                ${cancellationReason ? `<li><strong>Reden voor annulering:</strong> ${cancellationReason}</li>` : ''}
              </ul>
            </div>
            
            <p>Deze periode is nu weer beschikbaar voor nieuwe reserveringen.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${bookingUrl}" style="background-color: #ff6600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Bekijk verhuuroverzicht</a>
            </div>
            
            <p>Bij vragen kun je contact opnemen met onze klantenservice.</p>
          </div>
          ${getEmailFooter()}
        </div>
      `,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Booking cancellation email sent to owner ${ownerEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending booking cancellation email to owner:', error);
      throw new Error('Failed to send booking cancellation email to owner');
    }
  }

  /**
   * Send email notification for a payment received (to trailer owner)
   */
  export async function sendPaymentReceivedEmail(
    ownerEmail: string,
    ownerName: string,
    paymentDetails: {
      amount: number;
      currency?: string;
      trailerTitle: string;
      renterName: string;
      rentalId: string;
      platformFee?: number;
      totalPayout?: number;
      paymentDate: Date;
      ownerId: string;
    }
  ) {
    const { 
      amount, currency = 'EUR', trailerTitle, renterName, 
      rentalId, platformFee = 0, totalPayout = amount - platformFee, paymentDate, ownerId
    } = paymentDetails;
    
    // Check if owner has enabled payment received notifications
    const isEnabled = await isNotificationEnabled(ownerId, 'payments:payment_received');
    if (!isEnabled) {
      console.log(`Payment received email notifications disabled for owner ${ownerName} (${ownerId})`);
      return false;
    }
    
    const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/profiel?tab=rentals&mode=lessor`;
  
    const mailOptions = {
      from: `"BuurBak" <${process.env.SMTP_FROM || 'noreply@buurbak.nl'}>`,
      to: ownerEmail,
      subject: 'Betaling ontvangen',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${getEmailHeader()}
          <div style="padding: 20px;">
            <h2>Betaling ontvangen</h2>
            <p>Hallo ${ownerName},</p>
            <p>Goed nieuws! We hebben een betaling ontvangen voor de huur van je aanhanger "${trailerTitle}" door ${renterName}.</p>
            
            <div style="background-color: #f9f9f9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
              <p><strong>Betalingsdetails:</strong></p>
              <ul style="list-style-type: none; padding-left: 0;">
                <li><strong>Bedrag:</strong> €${amount.toFixed(2)}</li>
                <li><strong>Datum:</strong> ${formatDate(paymentDate)}</li>
                <li><strong>Huurder:</strong> ${renterName}</li>
                ${platformFee ? `<li><strong>Platformkosten:</strong> €${platformFee.toFixed(2)}</li>` : ''}
                ${totalPayout ? `<li><strong>Uit te betalen bedrag:</strong> €${totalPayout.toFixed(2)}</li>` : ''}
              </ul>
            </div>
            
            <p>Het geld zal volgens de standaard uitbetalingstermijn op je rekening worden bijgeschreven.</p>
            <p>Je kunt alle details van je verhuuractiviteiten bekijken door op de onderstaande knop te klikken.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${bookingUrl}" style="background-color: #ff6600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Bekijk verhuuroverzicht</a>
            </div>
            
            <p>Bij vragen kun je contact opnemen met onze klantenservice.</p>
          </div>
          ${getEmailFooter()}
        </div>
      `,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Payment received email sent to ${ownerEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending payment received email:', error);
      throw new Error('Failed to send payment received email');
    }
  }

  /**
   * Send email notification for a payout processed (to trailer owner)
   */
  export async function sendPayoutProcessedEmail(
    ownerEmail: string,
    ownerName: string,
    payoutDetails: {
      amount: number;
      currency?: string;
      bankAccount?: string; // Last 4 digits of bank account
      reference?: string;
      processingDate: Date;
      estimatedArrivalDate?: Date;
      ownerId: string;
    }
  ) {
    const { 
      amount, currency = 'EUR', bankAccount, 
      reference, processingDate, estimatedArrivalDate, ownerId
    } = payoutDetails;
    
    // Check if owner has enabled payout processed notifications
    const isEnabled = await isNotificationEnabled(ownerId, 'payments:payout_processed');
    if (!isEnabled) {
      console.log(`Payout processed email notifications disabled for owner ${ownerName} (${ownerId})`);
      return false;
    }
    
    const walletUrl = `${process.env.NEXT_PUBLIC_APP_URL}/profiel?tab=wallet`;
  
    const mailOptions = {
      from: `"BuurBak" <${process.env.SMTP_FROM || 'noreply@buurbak.nl'}>`,
      to: ownerEmail,
      subject: 'Uitbetaling verwerkt',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${getEmailHeader()}
          <div style="padding: 20px;">
            <h2>Uitbetaling verwerkt</h2>
            <p>Hallo ${ownerName},</p>
            <p>Goed nieuws! We hebben een uitbetaling verwerkt naar je bankrekening.</p>
            
            <div style="background-color: #f9f9f9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
              <p><strong>Uitbetalingsdetails:</strong></p>
              <ul style="list-style-type: none; padding-left: 0;">
                <li><strong>Bedrag:</strong> €${amount.toFixed(2)}</li>
                <li><strong>Verwerkingsdatum:</strong> ${formatDate(processingDate)}</li>
                ${bankAccount ? `<li><strong>Bankrekening:</strong> **** ${bankAccount}</li>` : ''}
                ${reference ? `<li><strong>Referentie:</strong> ${reference}</li>` : ''}
                ${estimatedArrivalDate ? `<li><strong>Verwachte aankomst:</strong> ${formatDate(estimatedArrivalDate)}</li>` : ''}
              </ul>
            </div>
            
            <p>Afhankelijk van je bank kan het 1-3 werkdagen duren voordat het bedrag op je rekening staat.</p>
            <p>Je kunt al je transacties bekijken door op de onderstaande knop te klikken.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${walletUrl}" style="background-color: #ff6600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Bekijk wallet</a>
            </div>
            
            <p>Bij vragen kun je contact opnemen met onze klantenservice.</p>
          </div>
          ${getEmailFooter()}
        </div>
      `,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Payout processed email sent to ${ownerEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending payout processed email:', error);
      throw new Error('Failed to send payout processed email');
    }
  }

  /**
   * Send email notification for a failed payment (to renter)
   */
  export async function sendPaymentFailedEmail(
    renterEmail: string,
    renterName: string,
    paymentDetails: {
      amount: number;
      currency?: string;
      trailerTitle: string;
      bookingId: string;
      failureReason?: string;
      retryUrl?: string;
      renterId: string;
    }
  ) {
    const { amount, currency = 'EUR', trailerTitle, bookingId, failureReason, retryUrl, renterId } = paymentDetails;
    
    // Check if renter has enabled payment failed notifications
    const isEnabled = await isNotificationEnabled(renterId, 'payments:payment_failed');
    if (!isEnabled) {
      console.log(`Payment failed email notifications disabled for renter ${renterName} (${renterId})`);
      return false;
    }
    
    const defaultRetryUrl = `${process.env.NEXT_PUBLIC_APP_URL}/profiel?tab=rentals&mode=renter`;
    
    const mailOptions = {
      from: `"BuurBak" <${process.env.SMTP_FROM || 'noreply@buurbak.nl'}>`,
      to: renterEmail,
      subject: 'Betaling mislukt',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${getEmailHeader()}
          <div style="padding: 20px;">
            <h2>Betaling mislukt</h2>
            <p>Hallo ${renterName},</p>
            <p>Helaas is je betaling voor de aanhanger "${trailerTitle}" mislukt.</p>
            
            <div style="background-color: #f9f9f9; border-left: 4px solid #ff6600; padding: 15px; margin: 20px 0;">
              <p><strong>Betalingsdetails:</strong></p>
              <ul style="list-style-type: none; padding-left: 0;">
                <li><strong>Bedrag:</strong> €${amount.toFixed(2)}</li>
                <li><strong>Aanhanger:</strong> ${trailerTitle}</li>
                ${failureReason ? `<li><strong>Reden:</strong> ${failureReason}</li>` : ''}
              </ul>
            </div>
            
            <p>Om je reservering te behouden, probeer de betaling opnieuw uit te voeren door op de onderstaande knop te klikken.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${retryUrl || defaultRetryUrl}" style="background-color: #ff6600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Probeer opnieuw te betalen</a>
            </div>
            
            <p>Als je problemen blijft ondervinden met de betaling, controleer je betaalmethode of neem contact op met onze klantenservice.</p>
          </div>
          ${getEmailFooter()}
        </div>
      `,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Payment failed email sent to ${renterEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending payment failed email:', error);
      throw new Error('Failed to send payment failed email');
    }
  }

  /**
   * Send email notification for a new message (to receiver)
   */
  export async function sendNewMessageEmail(
    receiverEmail: string,
    receiverName: string,
    messageDetails: {
      senderName: string;
      messagePreview: string;
      chatRoomId: string;
      isTrailerRelated?: boolean;
      trailerTitle?: string;
      receiverId: string;
    }
  ) {
    const { senderName, messagePreview, chatRoomId, isTrailerRelated, trailerTitle, receiverId } = messageDetails;
    
    // Check if receiver has enabled new message notifications
    const isEnabled = await isNotificationEnabled(receiverId, 'messages:new_message');
    if (!isEnabled) {
      console.log(`New message email notifications disabled for user ${receiverName} (${receiverId})`);
      return false;
    }
    
    const chatUrl = `${process.env.NEXT_PUBLIC_APP_URL}/profiel?tab=messages&chatId=${chatRoomId}`;
    
    const mailOptions = {
      from: `"BuurBak" <${process.env.SMTP_FROM || 'noreply@buurbak.nl'}>`,
      to: receiverEmail,
      subject: `Nieuw bericht van ${senderName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${getEmailHeader()}
          <div style="padding: 20px;">
            <h2>Je hebt een nieuw bericht ontvangen</h2>
            <p>Hallo ${receiverName},</p>
            <p>Je hebt een nieuw bericht ontvangen van ${senderName}${isTrailerRelated && trailerTitle ? ` over de aanhanger "${trailerTitle}"` : ''}.</p>
            
            <div style="background-color: #f9f9f9; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <p><strong>Berichtvoorbeeld:</strong></p>
              <p style="font-style: italic;">"${messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview}"</p>
            </div>
            
            <p>Klik op de onderstaande knop om het volledige bericht te bekijken en te beantwoorden.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${chatUrl}" style="background-color: #ff6600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Bekijk bericht</a>
            </div>
            
            <p>Snel reageren verbetert je responstijd en verhoogt de kans op succesvolle verhuur/huur.</p>
          </div>
          ${getEmailFooter()}
        </div>
      `,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`New message email sent to ${receiverEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending new message email:', error);
      throw new Error('Failed to send new message email');
    }
  }

  /**
   * Send email reminder for unread messages (to user)
   */
  export async function sendUnreadMessagesReminderEmail(
    userEmail: string,
    userName: string,
    reminderDetails: {
      unreadCount: number;
      senders: string[];
      userId: string;
    }
  ) {
    const { unreadCount, senders, userId } = reminderDetails;
    
    // Check if user has enabled unread message reminder notifications
    const isEnabled = await isNotificationEnabled(userId, 'messages:unread_reminder');
    if (!isEnabled) {
      console.log(`Unread messages reminder email notifications disabled for user ${userName} (${userId})`);
      return false;
    }
    
    const messagesUrl = `${process.env.NEXT_PUBLIC_APP_URL}/profiel?tab=messages`;
    
    // Get up to 3 sender names
    const senderPreview = senders.slice(0, 3).join(', ');
    const hasMoreSenders = senders.length > 3;
    
    const mailOptions = {
      from: `"BuurBak" <${process.env.SMTP_FROM || 'noreply@buurbak.nl'}>`,
      to: userEmail,
      subject: `Je hebt ${unreadCount} ongelezen bericht${unreadCount !== 1 ? 'en' : ''}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${getEmailHeader()}
          <div style="padding: 20px;">
            <h2>Je hebt ongelezen berichten</h2>
            <p>Hallo ${userName},</p>
            <p>Je hebt ${unreadCount} ongelezen bericht${unreadCount !== 1 ? 'en' : ''} van ${senderPreview}${hasMoreSenders ? ' en anderen' : ''}.</p>
            
            <p>Het tijdig beantwoorden van berichten verbetert je responstijd en verhoogt de kans op succesvolle verhuur/huur.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${messagesUrl}" style="background-color: #ff6600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Bekijk je berichten</a>
            </div>
          </div>
          ${getEmailFooter()}
        </div>
      `,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Unread messages reminder email sent to ${userEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending unread messages reminder email:', error);
      throw new Error('Failed to send unread messages reminder email');
    }
  }

  /**
   * Send email pickup reminder (to renter)
   */
  export async function sendPickupReminderEmail(
    renterEmail: string,
    renterName: string,
    reminderDetails: {
      trailerTitle: string;
      ownerName: string;
      pickupDate: Date;
      pickupLocation: string;
      rentalId: string;
      ownerPhone?: string;
      specialInstructions?: string;
      renterId: string;
    }
  ) {
    const { 
      trailerTitle, ownerName, pickupDate, pickupLocation, 
      rentalId, ownerPhone, specialInstructions, renterId
    } = reminderDetails;
    
    // Check if renter has enabled pickup reminder notifications
    const isEnabled = await isNotificationEnabled(renterId, 'reminders:pickup_reminder');
    if (!isEnabled) {
      console.log(`Pickup reminder email notifications disabled for renter ${renterName} (${renterId})`);
      return false;
    }
    
    const rentalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/profiel?tab=rentals&mode=renter&rentalId=${rentalId}`;
    
    const mailOptions = {
      from: `"BuurBak" <${process.env.SMTP_FROM || 'noreply@buurbak.nl'}>`,
      to: renterEmail,
      subject: `Herinnering: Aanhanger ophalen morgen`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${getEmailHeader()}
          <div style="padding: 20px;">
            <h2>Herinnering voor het ophalen van je aanhanger</h2>
            <p>Hallo ${renterName},</p>
            <p>Dit is een herinnering dat je morgen de aanhanger "${trailerTitle}" kunt ophalen.</p>
            
            <div style="background-color: #f9f9f9; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <p><strong>Ophaaldetails:</strong></p>
              <ul style="list-style-type: none; padding-left: 0;">
                <li><strong>Ophaaldatum:</strong> ${formatDate(pickupDate)}</li>
                <li><strong>Ophaallocatie:</strong> ${pickupLocation}</li>
                <li><strong>Eigenaar:</strong> ${ownerName}</li>
                ${ownerPhone ? `<li><strong>Telefoonnummer eigenaar:</strong> ${ownerPhone}</li>` : ''}
              </ul>
              ${specialInstructions ? `
                <p><strong>Speciale instructies:</strong></p>
                <p>${specialInstructions}</p>
              ` : ''}
            </div>
            
            <p>Vergeet niet om je identiteitsbewijs en rijbewijs mee te nemen.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${rentalUrl}" style="background-color: #ff6600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Bekijk reserveringsdetails</a>
            </div>
            
            <p>Bij vragen kun je contact opnemen met de eigenaar of onze klantenservice.</p>
          </div>
          ${getEmailFooter()}
        </div>
      `,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Pickup reminder email sent to ${renterEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending pickup reminder email:', error);
      throw new Error('Failed to send pickup reminder email');
    }
  }

  /**
   * Send email return reminder (to renter)
   */
  export async function sendReturnReminderEmail(
    renterEmail: string,
    renterName: string,
    reminderDetails: {
      trailerTitle: string;
      ownerName: string;
      returnDate: Date;
      returnLocation: string;
      rentalId: string;
      ownerPhone?: string;
      specialInstructions?: string;
      renterId: string;
    }
  ) {
    const { 
      trailerTitle, ownerName, returnDate, returnLocation, 
      rentalId, ownerPhone, specialInstructions, renterId
    } = reminderDetails;
    
    // Check if renter has enabled return reminder notifications
    const isEnabled = await isNotificationEnabled(renterId, 'reminders:return_reminder');
    if (!isEnabled) {
      console.log(`Return reminder email notifications disabled for renter ${renterName} (${renterId})`);
      return false;
    }
    
    const rentalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/profiel?tab=rentals&mode=renter&rentalId=${rentalId}`;
    
    const mailOptions = {
      from: `"BuurBak" <${process.env.SMTP_FROM || 'noreply@buurbak.nl'}>`,
      to: renterEmail,
      subject: `Herinnering: Aanhanger retourneren morgen`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${getEmailHeader()}
          <div style="padding: 20px;">
            <h2>Herinnering voor het retourneren van je aanhanger</h2>
            <p>Hallo ${renterName},</p>
            <p>Dit is een herinnering dat je morgen de aanhanger "${trailerTitle}" moet retourneren.</p>
            
            <div style="background-color: #f9f9f9; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <p><strong>Retourdetails:</strong></p>
              <ul style="list-style-type: none; padding-left: 0;">
                <li><strong>Retourdatum:</strong> ${formatDate(returnDate)}</li>
                <li><strong>Retourlocatie:</strong> ${returnLocation}</li>
                <li><strong>Eigenaar:</strong> ${ownerName}</li>
                ${ownerPhone ? `<li><strong>Telefoonnummer eigenaar:</strong> ${ownerPhone}</li>` : ''}
              </ul>
              ${specialInstructions ? `
                <p><strong>Speciale instructies:</strong></p>
                <p>${specialInstructions}</p>
              ` : ''}
            </div>
            
            <p>Zorg ervoor dat de aanhanger schoon en in dezelfde staat is als bij ophalen.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${rentalUrl}" style="background-color: #ff6600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Bekijk reserveringsdetails</a>
            </div>
            
            <p>Bij vragen kun je contact opnemen met de eigenaar of onze klantenservice.</p>
          </div>
          ${getEmailFooter()}
        </div>
      `,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Return reminder email sent to ${renterEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending return reminder email:', error);
      throw new Error('Failed to send return reminder email');
    }
  }

  /**
   * Send email review reminder (to renter or owner)
   */
  export async function sendReviewReminderEmail(
    userEmail: string,
    userName: string,
    reminderDetails: {
      trailerTitle: string;
      otherPartyName: string;
      rentalId: string;
      isRenter: boolean;
      rentalEndDate: Date;
      userId: string;
    }
  ) {
    const { trailerTitle, otherPartyName, rentalId, isRenter, rentalEndDate, userId } = reminderDetails;
    
    // Check if user has enabled review reminder notifications
    const isEnabled = await isNotificationEnabled(userId, 'reminders:review_reminder');
    if (!isEnabled) {
      console.log(`Review reminder email notifications disabled for user ${userName} (${userId})`);
      return false;
    }
    
    const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/profiel?tab=${isRenter ? 'rentals&mode=renter' : 'rentals&mode=lessor'}&rentalId=${rentalId}&review=true`;
    
    const mailOptions = {
      from: `"BuurBak" <${process.env.SMTP_FROM || 'noreply@buurbak.nl'}>`,
      to: userEmail,
      subject: `Deel je ervaring - Laat een review achter`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${getEmailHeader()}
          <div style="padding: 20px;">
            <h2>Deel je ervaring met een review</h2>
            <p>Hallo ${userName},</p>
            <p>Je ${isRenter ? 'huur' : 'verhuur'} van de aanhanger "${trailerTitle}" is afgelopen. We hopen dat je een goede ervaring hebt gehad!</p>
            
            <p>Zou je een moment willen nemen om een review achter te laten over ${isRenter ? 'de aanhanger en de eigenaar' : 'de huurder'}? Dit helpt andere gebruikers en verbetert de BuurBak community.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${reviewUrl}" style="background-color: #ff6600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Schrijf een review</a>
            </div>
            
            <p>Reviews worden binnen de BuurBak community zeer gewaardeerd en helpen om vertrouwen op te bouwen tussen huurders en verhuurders.</p>
          </div>
          ${getEmailFooter()}
        </div>
      `,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Review reminder email sent to ${userEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending review reminder email:', error);
      throw new Error('Failed to send review reminder email');
    }
  }

  /**
   * Send email promotion (to user)
   */
  export async function sendPromotionEmail(
    userEmail: string,
    userName: string,
    promotionDetails: {
      title: string;
      description: string;
      promoCode?: string;
      expiryDate?: Date;
      imageUrl?: string;
      actionUrl?: string;
      actionText?: string;
      userId: string;
    }
  ) {
    const { 
      title, description, promoCode, expiryDate, 
      imageUrl, actionUrl, actionText = 'Bekijk aanbieding', userId
    } = promotionDetails;
    
    // Check if user has enabled promotional email notifications
    const isEnabled = await isNotificationEnabled(userId, 'marketing:promotions');
    if (!isEnabled) {
      console.log(`Promotional email notifications disabled for user ${userName} (${userId})`);
      return false;
    }
    
    const defaultActionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/aanbod`;
    
    const mailOptions = {
      from: `"BuurBak" <${process.env.SMTP_FROM || 'noreply@buurbak.nl'}>`,
      to: userEmail,
      subject: title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${getEmailHeader()}
          <div style="padding: 20px;">
            <h2>${title}</h2>
            <p>Hallo ${userName},</p>
            
            ${imageUrl ? `
              <div style="text-align: center; margin: 20px 0;">
                <img src="${imageUrl}" alt="${title}" style="max-width: 100%; height: auto; border-radius: 4px;">
              </div>
            ` : ''}
            
            <p>${description}</p>
            
            ${promoCode ? `
              <div style="background-color: #f9f9f9; border: 1px dashed #ccc; text-align: center; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px;">Gebruik deze promocode</p>
                <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 10px 0;">${promoCode}</p>
                ${expiryDate ? `<p style="margin: 0; font-size: 12px; color: #666;">Geldig t/m ${formatDate(expiryDate)}</p>` : ''}
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionUrl || defaultActionUrl}" style="background-color: #ff6600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">${actionText}</a>
            </div>
          </div>
          ${getEmailFooter()}
          <div style="text-align: center; padding: 10px; font-size: 11px; color: #999;">
            <p>Je ontvangt deze e-mail omdat je je hebt aangemeld voor promotionele e-mails van BuurBak. 
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/profiel?tab=settings&section=notifications" style="color: #999; text-decoration: underline;">Uitschrijven</a></p>
          </div>
        </div>
      `,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Promotion email sent to ${userEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending promotion email:', error);
      throw new Error('Failed to send promotion email');
    }
  }

  /**
   * Send email newsletter (to user)
   */
  export async function sendNewsletterEmail(
    userEmail: string,
    userName: string,
    newsletterDetails: {
      title: string;
      sections: Array<{
        heading: string;
        content: string;
        imageUrl?: string;
        linkUrl?: string;
        linkText?: string;
      }>;
      month?: string;
      year?: number;
      userId: string;
    }
  ) {
    const { title, sections, month, year = new Date().getFullYear(), userId } = newsletterDetails;
    
    // Check if user has enabled newsletter notifications
    const isEnabled = await isNotificationEnabled(userId, 'marketing:newsletter');
    if (!isEnabled) {
      console.log(`Newsletter email notifications disabled for user ${userName} (${userId})`);
      return false;
    }
    
    // Build sections HTML
    const sectionsHtml = sections.map(section => `
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 10px;">${section.heading}</h3>
        ${section.imageUrl ? `
          <img src="${section.imageUrl}" alt="${section.heading}" style="max-width: 100%; height: auto; border-radius: 4px; margin-bottom: 15px;">
        ` : ''}
        <p>${section.content}</p>
        ${section.linkUrl && section.linkText ? `
          <p><a href="${section.linkUrl}" style="color: #ff6600; text-decoration: underline;">${section.linkText}</a></p>
        ` : ''}
      </div>
    `).join('');
    
    const mailOptions = {
      from: `"BuurBak" <${process.env.SMTP_FROM || 'noreply@buurbak.nl'}>`,
      to: userEmail,
      subject: `${month ? `${month} ` : ''}Nieuwsbrief${month ? '' : ' - BuurBak'} ${year}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${getEmailHeader()}
          <div style="padding: 20px;">
            <h2>${title}</h2>
            <p>Hallo ${userName},</p>
            
            ${sectionsHtml}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="background-color: #ff6600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Bezoek onze website</a>
            </div>
            
            <p>Bedankt voor je deelname aan de BuurBak community!</p>
            <p>Met vriendelijke groet,<br>Het BuurBak Team</p>
          </div>
          ${getEmailFooter()}
          <div style="text-align: center; padding: 10px; font-size: 11px; color: #999;">
            <p>Je ontvangt deze nieuwsbrief omdat je je hebt aangemeld voor updates van BuurBak. 
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/profiel?tab=settings&section=notifications" style="color: #999; text-decoration: underline;">Uitschrijven</a></p>
          </div>
        </div>
      `,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Newsletter email sent to ${userEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending newsletter email:', error);
      throw new Error('Failed to send newsletter email');
    }
  }

  /**
   * Send email for new features announcement (to user)
   */
  export async function sendNewFeaturesEmail(
    userEmail: string,
    userName: string,
    featureDetails: {
      title: string;
      features: Array<{
        name: string;
        description: string;
        imageUrl?: string;
      }>;
      userId: string;
    }
  ) {
    const { title, features, userId } = featureDetails;
    
    // Check if user has enabled new features notifications
    const isEnabled = await isNotificationEnabled(userId, 'marketing:new_features');
    if (!isEnabled) {
      console.log(`New features email notifications disabled for user ${userName} (${userId})`);
      return false;
    }
    
    // Build features HTML
    const featuresHtml = features.map(feature => `
      <div style="margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px;">
        <h3 style="color: #333; margin-bottom: 10px;">${feature.name}</h3>
        ${feature.imageUrl ? `
          <img src="${feature.imageUrl}" alt="${feature.name}" style="max-width: 100%; height: auto; border-radius: 4px; margin-bottom: 15px;">
        ` : ''}
        <p>${feature.description}</p>
      </div>
    `).join('');
    
    const mailOptions = {
      from: `"BuurBak" <${process.env.SMTP_FROM || 'noreply@buurbak.nl'}>`,
      to: userEmail,
      subject: title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${getEmailHeader()}
          <div style="padding: 20px;">
            <h2>${title}</h2>
            <p>Hallo ${userName},</p>
            <p>We zijn verheugd om je te informeren over enkele nieuwe functies en verbeteringen die we aan BuurBak hebben toegevoegd:</p>
            
            ${featuresHtml}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="background-color: #ff6600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Ontdek de nieuwe functies</a>
            </div>
            
            <p>We hopen dat deze updates je ervaring met BuurBak zullen verbeteren. Als je feedback hebt, laat het ons weten!</p>
            <p>Met vriendelijke groet,<br>Het BuurBak Team</p>
          </div>
          ${getEmailFooter()}
          <div style="text-align: center; padding: 10px; font-size: 11px; color: #999;">
            <p>Je ontvangt deze e-mail omdat je je hebt aangemeld voor updates over nieuwe functies van BuurBak. 
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/profiel?tab=settings&section=notifications" style="color: #999; text-decoration: underline;">Uitschrijven</a></p>
          </div>
        </div>
      `,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`New features email sent to ${userEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending new features email:', error);
      throw new Error('Failed to send new features email');
    }
  }