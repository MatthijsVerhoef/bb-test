// scripts/migrate-profile-images.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { v2: cloudinary } = require('cloudinary');

// Initialize Prisma client
const prisma = new PrismaClient();

// Check if Cloudinary is configured correctly
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Cloudinary environment variables are not properly set!');
  console.error('Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.');
  process.exit(1);
}

// Initialize Cloudinary with environment variables
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

async function migrateProfileImages() {
  console.log('Starting profile image migration to Cloudinary...');
  
  try {
    // Verify Cloudinary configuration is working
    const testResult = await cloudinary.api.ping();
    console.log('Cloudinary connection test result:', testResult);
  } catch (error) {
    console.error('Error connecting to Cloudinary. Please check your credentials:', error);
    process.exit(1);
  }
  
  // Get all users with profile pictures
  const users = await prisma.user.findMany({
    where: {
      profilePicture: {
        not: null,
      },
    },
    select: {
      id: true,
      email: true,
      profilePicture: true,
    },
  });
  
  console.log(`Found ${users.length} users with profile pictures`);
  
  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (const user of users) {
    try {
      // Skip if the profile picture URL is already a Cloudinary URL
      if (user.profilePicture.includes('cloudinary.com')) {
        console.log(`User ${user.email} already has a Cloudinary profile picture, skipping...`);
        skippedCount++;
        continue;
      }
      
      // Construct the local file path
      const localFilePath = path.join(process.cwd(), 'public', user.profilePicture);
      
      // Check if the file exists
      if (!fs.existsSync(localFilePath)) {
        console.log(`File ${localFilePath} not found for user ${user.email}, skipping...`);
        skippedCount++;
        continue;
      }
      
      console.log(`Migrating profile picture for user ${user.email} (${localFilePath})...`);
      
      // Upload the file to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(localFilePath, {
        folder: `profiles/${user.id}`,
        resource_type: 'image',
        transformation: [
          { width: 500, height: 500, crop: 'limit' },
          { quality: 'auto' },
        ],
      });
      
      // Update the user's profile picture URL
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          profilePicture: uploadResult.secure_url,
        },
      });
      
      console.log(`Successfully migrated profile picture for user ${user.email} to ${uploadResult.secure_url}`);
      successCount++;
      
      // Optionally, delete the local file after successful migration
      // Uncomment the next lines if you want to delete the local files
      // fs.unlinkSync(localFilePath);
      // console.log(`Deleted local file ${localFilePath}`);
    } catch (error) {
      console.error(`Error migrating profile picture for user ${user.email}:`, error);
      errorCount++;
    }
  }
  
  console.log('\nMigration Summary:');
  console.log(`- Total users processed: ${users.length}`);
  console.log(`- Successfully migrated: ${successCount}`);
  console.log(`- Skipped: ${skippedCount}`);
  console.log(`- Errors: ${errorCount}`);
  
  console.log('\nMigration completed!');
}

// Run the migration
migrateProfileImages()
  .catch((error) => {
    console.error('Migration failed:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });