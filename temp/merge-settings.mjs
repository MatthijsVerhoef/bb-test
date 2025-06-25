import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Set up __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const baseDir = '/Users/matthijsverhoef/Documents/Projecten/buurbak-final/public/locales';
const langs = ['en', 'nl', 'de'];

// Settings content
const enSettings = {
  "settings": {
    "dialog": {
      "title": "Settings",
      "description": "Manage your account settings and preferences",
      "backButton": "Back"
    },
    "sections": {
      "account": "Account",
      "lessorSettings": "Lessor Settings",
      "notifications": "Notifications",
      "security": "Security",
      "billing": "Billing"
    },
    "logout": "Logout",
    "account": {
      "password": {
        "title": "Password",
        "description": "Keep your account secure with a strong password",
        "changeButton": "Change password",
        "dialog": {
          "title": "Change password",
          "description": "Choose a strong password of at least 8 characters",
          "currentPassword": "Current password",
          "newPassword": "New password",
          "confirmPassword": "Confirm password",
          "passwordMismatch": "Passwords do not match",
          "passwordTooShort": "Password must be at least 8 characters long",
          "cancel": "Cancel",
          "change": "Change"
        },
        "success": "Password successfully changed"
      },
      "accountManagement": {
        "title": "Account management",
        "description": "Temporarily deactivate or permanently delete",
        "deactivateButton": "Deactivate account",
        "deleteButton": "Delete account",
        "deactivateDialog": {
          "title": "Deactivate account?",
          "description": "Your account will be temporarily disabled. You can log back in at any time to reactivate your account.",
          "cancel": "Cancel",
          "deactivate": "Deactivate"
        },
        "deleteDialog": {
          "title": "Permanently delete account?",
          "description": "This action cannot be undone. All your data will be permanently deleted.",
          "confirmationLabel": "Type your email to confirm:",
          "cancel": "Cancel",
          "delete": "Delete",
          "deleting": "Deleting..."
        }
      }
    },
    "lessorSettings": {
      "autoApproval": {
        "title": "Automatic approval",
        "description": "Automatically accept bookings from reliable renters",
        "toggle": "Automatic approval",
        "toggleDescription": "Bookings will be directly confirmed if they meet your criteria",
        "minRating": {
          "toggle": "Require minimum rating",
          "toggleDescription": "Only accept renters with a minimum rating",
          "label": "Minimum score",
          "star": "star"
        },
        "minRentals": {
          "label": "Minimum number of previous rentals",
          "options": {
            "none": "No minimum",
            "one": "1 rental",
            "three": "3 rentals",
            "five": "5 rentals",
            "ten": "10 rentals"
          }
        },
        "verifiedOnly": {
          "label": "Verified users only",
          "description": "Only users with a verified driver's license"
        }
      },
      "rentalTerms": {
        "title": "Rental terms",
        "description": "Default settings for new trailers",
        "minDuration": {
          "label": "Minimum rental duration",
          "options": {
            "oneDay": "1 day",
            "twoDays": "2 days",
            "threeDays": "3 days",
            "oneWeek": "1 week"
          }
        },
        "maxDuration": {
          "label": "Maximum rental duration",
          "options": {
            "oneWeek": "1 week",
            "twoWeeks": "2 weeks",
            "oneMonth": "1 month",
            "twoMonths": "2 months",
            "threeMonths": "3 months"
          }
        },
        "securityDeposit": {
          "label": "Security deposit percentage",
          "description": "Percentage of the total rental price as deposit"
        }
      },
      "cancellationPolicy": {
        "title": "Cancellation policy",
        "description": "Determine when renters can cancel",
        "policies": {
          "flexible": {
            "label": "Flexible",
            "description": "Free cancellation up to 24 hours before pickup"
          },
          "moderate": {
            "label": "Moderate",
            "description": "100% refund for cancellation within 72 hours"
          },
          "strict": {
            "label": "Strict",
            "description": "No refund within 7 days"
          },
          "custom": {
            "label": "Custom",
            "description": "Create your own policy",
            "placeholder": "Describe your cancellation policy..."
          }
        }
      },
      "saveButton": {
        "saving": "Saving...",
        "save": "Save settings",
        "noChanges": "No changes to save"
      }
    },
    "notifications": {
      "loading": "Loading settings...",
      "emailNotifications": {
        "disabled": {
          "title": "Email notifications are disabled",
          "description": "You won't receive any emails from us until you enable this again"
        }
      },
      "categories": {
        "bookings": {
          "title": "Bookings",
          "description": "Updates about your rentals and reservations",
          "settings": {
            "booking_request": {
              "label": "New booking requests",
              "description": "When someone wants to rent your trailer"
            },
            "booking_confirmed": {
              "label": "Booking confirmations",
              "description": "When a booking is confirmed"
            },
            "booking_cancelled": {
              "label": "Cancellations",
              "description": "When a booking is cancelled"
            },
            "booking_modified": {
              "label": "Modifications",
              "description": "When booking details are modified"
            }
          }
        },
        "payments": {
          "title": "Payments",
          "description": "Financial transactions and payouts",
          "settings": {
            "payment_received": {
              "label": "Payment received",
              "description": "When you have received a payment"
            },
            "payout_processed": {
              "label": "Payout processed",
              "description": "When money has been transferred to your account"
            },
            "payment_failed": {
              "label": "Failed payments",
              "description": "When a payment has failed"
            }
          }
        },
        "messages": {
          "title": "Messages",
          "description": "Communication with renters and lessors",
          "settings": {
            "new_message": {
              "label": "New messages",
              "description": "When you receive a new message"
            },
            "unread_reminder": {
              "label": "Unread messages reminder",
              "description": "Daily reminder for unread messages"
            }
          }
        },
        "reminders": {
          "title": "Reminders",
          "description": "Important dates and actions",
          "settings": {
            "pickup_reminder": {
              "label": "Pickup reminder",
              "description": "24 hours before picking up a trailer"
            },
            "return_reminder": {
              "label": "Return reminder",
              "description": "24 hours before returning a trailer"
            },
            "review_reminder": {
              "label": "Leave a review",
              "description": "Reminder to leave a review"
            }
          }
        },
        "marketing": {
          "title": "Offers & News",
          "description": "Updates about new features and offers",
          "settings": {
            "promotions": {
              "label": "Special offers",
              "description": "Discounts and promotions"
            },
            "newsletter": {
              "label": "Newsletter",
              "description": "Monthly updates and tips"
            },
            "new_features": {
              "label": "New features",
              "description": "When we launch new features"
            }
          }
        }
      },
      "saveButton": {
        "saving": "Saving...",
        "save": "Save settings",
        "noChanges": "No changes to save"
      }
    },
    "security": {
      "twoFactor": {
        "title": "Two-factor authentication",
        "description": "Extra security for your account",
        "authApp": {
          "label": "Use authentication app",
          "description": "Requires a code with every new login"
        }
      },
      "loginAlerts": {
        "title": "Notifications",
        "description": "Alerts for account activity",
        "newLogin": {
          "label": "Email on new login",
          "description": "Notification when logging in from a new device"
        }
      },
      "devices": {
        "title": "Devices",
        "description": "{{count}} active sessions",
        "current": "current",
        "removeButton": "Remove",
        "removeDialog": {
          "title": "Remove device?",
          "description": "This device will be logged out and will need to log in again.",
          "cancel": "Cancel",
          "remove": "Remove"
        }
      }
    },
    "billing": {
      "paymentMethods": {
        "title": "Payment methods",
        "description": "Manage your cards for payments and receive rental income"
      },
      "transactions": {
        "title": "Transaction history",
        "emptyState": "There are no transactions to display yet",
        "status": {
          "completed": "Completed",
          "pending": "Pending"
        }
      }
    }
  }
};

// Read the settings
const nlSettings = JSON.parse(fs.readFileSync('/Users/matthijsverhoef/Documents/Projecten/buurbak-final/temp/nl_settings.json', 'utf8'));
const deSettings = JSON.parse(fs.readFileSync('/Users/matthijsverhoef/Documents/Projecten/buurbak-final/temp/de_settings.json', 'utf8'));

// Process each language
langs.forEach(lang => {
  const profilePath = path.join(baseDir, lang, 'profile.json');
  const profileData = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
  
  // Add settings section
  if (lang === 'en') {
    profileData.settings = enSettings.settings;
  } else if (lang === 'nl') {
    profileData.settings = nlSettings.settings;
  } else if (lang === 'de') {
    profileData.settings = deSettings.settings;
  }
  
  // Write the updated file
  fs.writeFileSync(profilePath, JSON.stringify(profileData, null, 2), 'utf8');
  console.log(`Updated ${lang} translations`);
});

console.log('All translation files updated');