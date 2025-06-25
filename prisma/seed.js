// prisma/seed.ts
import { PrismaClient, UserRole, TrailerType, RentalStatus, PaymentStatus, MediaType, NotificationType, ReportStatus, DocumentType, PaymentMethod, TransactionType, DamageStatus, InsuranceType, DayOfWeek } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Bepaal het aantal entiteiten dat we willen aanmaken
const USERS_COUNT = 50;
const TRAILERS_COUNT = 100;
const RENTALS_COUNT = 200;
const REVIEWS_COUNT = 150;

const trailerImages = [
  "https://images.ovis.nl/497bffac74cba961ac3c457ff73d156f86bfe6291235e88131b411959992dde1.jpg/large/normalfitcanvas/blank",
  "https://www.cluistra.com/wp-content/uploads/2019/04/P1050793-600x380.jpg",
  "https://titanjelsum.nl/wp-content/uploads/2019/02/aanhangwagens.jpg",
  "https://www.aanhangerhuren-zwolle.nl/wp-content/uploads/2020/06/open-aanhangwagen-huren-zwolle.jpg",
  "https://www.aanhangcars.nl/media/catalog/product/cache/0dc48c85a200721ec76a991b26eff20f/a/h/ahc.01.101.257.22.10-a.jpg",
  "https://www.jagersaanhangwagens.nl/wp-content/uploads/2020/08/20190705_104940.jpg",
  "https://www.aanhangwagens-mario.be/wp-content/uploads/2020/01/dubbelgrijs.jpg",
  "https://www.heesbeen.nl/wp-content/uploads/cm/3/aanhanger_met_huif_groot2.jpg",
  "https://www.truck1.nl/img/xxl/18121/ERZODA-Catering-Trailer-Food-Truck-Concession-trailer-Food-Trailers-catering-truck-China_18121_1684930931.jpg",
  "https://www.truck1.nl/img/xxl/18121/ERZODA-Catering-Trailer-Food-Truck-Concession-trailer-Food-Trailers-catering-truck-China_18121_6882821665.jpg",
  "https://lh5.googleusercontent.com/proxy/YTIF1Ym3Ko4pz52Xu-VchPdsUH7XcYiUNINXvW7mWuj5L2DoybrI7NlRZhpU-QCR5I2Yb-Hn19Myisp1Fb7HL3aEA49jtal2XRZFbKprI4N81TTcq5TRtglmLjW9D_3jisMz5zU",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmlHklDyKBa1cVodMnrVhWVPfV8WdAMfHR3w&s",
  "https://pegabv.nl/wp-content/uploads/2023/03/8561c8d2-f9f1-41da-a876-b19dfd66c441-e1679040852845-1024x576.jpg",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTxv4D_FbXMjnykGthYxXElWaPV531wqATNCMhyI0hOT7m1vw58byzw5GxoK0famv0cUFU&usqp=CAU",
  "https://cdn.webshopapp.com/shops/255717/files/309235538/image.jpg",
  "https://hocaraanhangwagens.nl/images/57303",
  "https://fokkema-aanhangwagens.nl/images/6120",
  "https://www.firstmove-prijslijsten.nl/uploads/images/8527/Cheval-Liberte-paardentrailer-van-Aanhangwagens-West-Brabant1.jpg",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSF9yRIe40FyNjQbtARneUHY0Tzhzw3IprhOw&s",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSExZEDbMUHcpdQGPGN25Un-SFbeXZfN6kudw&s",
  "https://www.jekuntmijhuren.nl/wp-content/uploads/2016/05/P1100481.jpg",
  "https://www.autobedrijfokken.nl/upload/page/article_images_1_1719583272600818805.jpg",
  "https://www.care4more.nl/sites/default/files/styles/visual_medium/public/2019-09/Driewielfiets%20aanhanger%203.jpg.webp?itok=uUA2t4Ds",
  "https://paspesse.nl/images/42865",
  "https://www.hulleman-zn.nl/wp-content/uploads/2020/08/IMG_20200801_130127_2-scaled.jpg",
  "https://sterktrailers.com/wp-content/uploads/2020/04/platte_aanhanger_vrachtwagen_sterk_schamel_aanhangwagen_3_asser_900mm_laadvloer_hoog_sterkte_staal_strenx_700_mc_2022_7216604-20.jpg-1024x768.webp",
  "https://www.gromaxverhuur.nl/app/uploads/2024/04/aanhanger-parallax.jpg",
  "https://d1kqllve43agrl.cloudfront.net/imgs/Saris-arba-2000-18192.jpeg",
  "https://www.traileroutlet.be/wp-content/uploads//2022/05/DSC_4332-1-scaled.jpg",
  "https://titanjelsum.nl/wp-content/uploads/2019/02/DSC00947-640-x-480-1200x900.jpg",
  "https://www.prolech.nl/data/upload/Shop/images/zeil-aanhanger-1-0.jpg",
  "https://cdn.prod.website-files.com/61d2cc60591a4a3d46b9b65f/6241bb3d533ebc0b526a7b03_Aanhanger%20enkelasser%20met%20opbouw.jpg",
  "https://www.vanraam.com/assets/img/92379/1695106863-van-raam-easy-rider-driewielfiets-aanhanger-recreaties.jpg?auto=format&crop=focalpoint",
  "https://www.brabantquads.nl/userdata/artikelen/logic-aanhanger-841-nl-G.jpg",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-7sCV77RQ_6CgltVGjFSf8pGNh9txtIxhYQ&s",
  "https://www.jekuntmijhuren.nl/wp-content/uploads/2016/05/12m-Aanhangerhoogwerker-3.jpg",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTugooAnq1eLbqNszeN2E6wAYSOwgdtAqMpjg&s",
  "https://www.verkeersschoolvandongen.nl/wp-content/uploads/2024/10/Busje-met-aanhangwagen-aangepast-formaat-scaled.jpg",
  "https://www.trailertrading.nl/wp-content/uploads/2024/10/IMG_3198.jpg",
  "https://www.tractors-and-machinery.nl/media/user/2/5/0/747052_Burg_Bura-1023-Container_1.jpg",
  "https://images.2dehands.com/api/v1/listing-twh-p/images/30/30629191-bc3c-45d6-91ba-aa4736dedc5b?rule=ecg_mp_eps$_84",
  "https://www.jekuntmijhuren.nl/wp-content/uploads/2022/11/15m-Aanhangerhoogwerker-Omme-1.jpg",
  "https://images.marktplaats.com/api/v1/listing-mp-p/images/ce/ced8cf54-1c72-402e-8197-255efd552e39?rule=ecg_mp_eps$_84",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDz70Yosd4yoRKYQhWvYD_HdOXqXAy-QDnhw&s",
  "https://titanjelsum.nl/wp-content/uploads/2019/02/DSC01539-640-x-480-450x450.jpg",
  "https://www.noyens.be/images/recente%20projecten/802266%20Foets/802266%20middenas%20aanhangwagen%20voor%20heftuck%20transport%20en%20minigravers.jpg",
  "https://www.industrieleaanhangers.nl/wp-content/uploads/2020/01/Aanhanger-heftruck-3-scaled.jpg",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRlkEkoBhosPsvQ4saYh-mKq9wzQdsUoBVzwhh5eYP-oJHzGPYPjd51Nhny8robRpgdMjA&usqp=CAU",
  "https://www.prolech.nl/data/upload/Shop/images/zeil-aanhanger-21-0.jpg",
  "https://www.truck1.nl/img/xxl/9005/Leger-aanhanger-Nederland_9005_9587308367054.jpg",
];


// Helper functie om een willekeurig element te selecteren uit een array
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper functie om een willekeurig aantal items te selecteren uit een array
function randomItems(array, min, max) {
  const count = faker.number.int({ min, max });
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Helper functie om een wachtwoord te hashen
async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Functie om een willekeurige datum te genereren tussen twee data
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seed() {
  console.log('🌱 Seeding database...');

  // Verwijder bestaande data om dubbele data te voorkomen
  console.log('🧹 Cleaning existing data...');
  await cleanDatabase();
  
  // 1. Maak gebruikers aan
  console.log('👥 Creating users...');
  const users = await createUsers();
  
  // 2. Maak hoofdcategorieën aan
  console.log('🏷️ Creating main categories...');
  const mainCategories = await createMainCategories();
  
  // 3. Maak trailer categorieën aan
  console.log('🏷️ Creating trailer categories...');
  const trailerCategories = await createTrailerCategories(mainCategories);
  
  // 4. Maak aanhangers aan
  console.log('🚛 Creating trailers...');
  const trailers = await createTrailers(users, trailerCategories);
  
  // 5. Maak wekelijkse beschikbaarheid aan
  console.log('📅 Creating weekly availabilities...');
  await createWeeklyAvailabilities(trailers);
  
  // 6. Maak uitzonderingen in beschikbaarheid aan
  console.log('🗓️ Creating availability exceptions...');
  await createAvailabilityExceptions(trailers);
  
  // 7. Maak accessoires aan
  console.log('🔧 Creating accessories...');
  await createAccessories(trailers);
  
  // 8. Maak FAQ's aan
  console.log('❓ Creating FAQs...');
  await createFAQs();
  await createTrailerFAQs(trailers);
  
  // 9. Maak verzekeringen aan
  console.log('🔒 Creating insurances...');
  const insurances = await createInsurances(users, trailers);
  
  // 10. Maak huurovereenkomsten aan
  console.log('📝 Creating rentals...');
  const rentals = await createRentals(users, trailers, insurances);
  
  // 11. Maak betalingen aan
  console.log('💰 Creating payments...');
  await createPayments(rentals);
  
  // 12. Maak beoordelingen aan
  console.log('⭐ Creating reviews...');
  await createReviews(users, trailers, rentals);
  
  // 13. Maak favorieten aan
  console.log('❤️ Creating favorites...');
  await createFavorites(users, trailers);
  
  // 14. Maak media aan
  console.log('🖼️ Creating media...');
  await createMedia(trailers);
  
  // 15. Maak chatberichten aan
  console.log('💬 Creating chat messages...');
  await createChatMessages(users);
  
  // 16. Maak schaderapporten en claims aan
  console.log('🔨 Creating damage reports and insurance claims...');
  await createDamageReportsAndClaims(users, trailers, rentals, insurances);
  
  // 17. Maak blogs en categorieën aan
  console.log('📰 Creating blogs and categories...');
  await createBlogsAndCategories();

  // 18. Maak ondersteuningstickets aan
  console.log('🎫 Creating support tickets...');
  await createSupportTickets(users);
  
  // 19. Maak gebruikersstatistieken aan
  console.log('📊 Creating user stats...');
  await createUserStats(users);
  
  // 20. Maak notificaties aan
  console.log('🔔 Creating notifications...');
  await createNotifications(users);
  
  // 21. Maak documentatie aan
  console.log('📄 Creating documents...');
  await createDocuments(users);
  
  // 22. Maak wallets en transacties aan
  console.log('👛 Creating wallets and transactions...');
  await createWalletsAndTransactions(users);

  // 23. Maak analytische events aan
  console.log('📈 Creating analytics events...');
  await createAnalyticsEvents();
  
  // 24. Maak marketing statistieken aan
  console.log('📱 Creating marketing stats...');
  await createMarketingStats();
  
  // 25. Maak systeeminstellingen aan
  console.log('⚙️ Creating system settings...');
  await createSystemSettings();
  
  // 26. Maak transactielogs aan
  console.log('📜 Creating transaction logs...');
  await createTransactionLogs(users);

  console.log('✅ Seeding completed!');
}

// Helper functies om de entiteiten aan te maken
async function cleanDatabase() {
  // Verwijder alle records in omgekeerde volgorde om foreign key constraints niet te schenden
  const tablesToClean = [
    'AnalyticsEvent', 'MarketingStat', 'SystemSettings', 'TransactionLog',
    'WalletTransaction', 'Wallet', 'ApiKey', 'Contact', 'Page', 'FAQ',
    'BusinessHours', 'EmailTemplate', 'SEOSettings', 'BlogCategory', 'Blog',
    'SupportReply', 'SupportTicket', 'InsuranceClaim', 'DamageReport', 'Document',
    'Favorite', 'Media', 'ChatRoomParticipant', 'ChatMessage', 'ChatRoom',
    'UserStats', 'Notification', 'Payment', 'Review', 'RentalChecklistItem',
    'RentalExtension', 'Rental', 'Insurance', 'Coupon', 'TrailerFAQ',
    'Accessory', 'MaintenanceLog', 'AvailabilityException', 'WeeklyAvailability',
    'Trailer', 'TrailerCategory', 'MainCategory', 'UserPreference', 'LoginHistory', 'DeviceToken',
    'SearchHistory'
    // 'User' is removed to avoid foreign key constraint issues
  ];

  for (const table of tablesToClean) {
    try {
      // @ts-ignore - Dynamisch tablename wordt niet herkend door TypeScript
      await prisma[table.charAt(0).toLowerCase() + table.slice(1)].deleteMany({});
      console.log(`Cleaned ${table} table`);
    } catch (err) {
      console.log(`Error cleaning ${table} table: ${err}`);
    }
  }
  
  // Check for existing admin user to avoid unique constraint violation
  console.log("Checking for existing users...");
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@example.com' }
  });
  
  if (existingAdmin) {
    console.log("Admin user already exists, cleaning up related tables instead of deleting users");
  } else {
    try {
      await prisma.user.deleteMany({});
      console.log("Cleaned User table");
    } catch (err) {
      console.log(`Error cleaning User table: ${err}`);
    }
  }
}

async function createUsers() {
  // Set all users to have the same password: admin123
  const hashedPassword = await hashPassword('admin123');
  
  // Check if admin user already exists
  let admin = await prisma.user.findUnique({
    where: { email: 'admin@example.com' }
  });
  
  if (!admin) {
    // Create admin user if it doesn't exist
    console.log("Creating admin user...");
    admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        phone: '+31612345678',
        address: 'Adminstraat 1',
        city: 'Amsterdam',
        postalCode: '1000 AA',
        country: 'Netherlands',
        isVerified: true,
        role: UserRole.ADMIN,
        emailNotifications: true,
        pushNotifications: true,
        languagePreference: 'nl',
      }
    });
    
    // Create admin preferences
    await prisma.userPreference.create({
      data: {
        darkMode: false,
        notifyBeforeRental: 24,
        notifyBeforeReturn: 24,
        defaultSearchRadius: 25,
        hideEmail: false,
        hidePhone: false,
        userId: admin.id
      }
    });
  } else {
    console.log("Admin user already exists, skipping creation");
  }
  
  // Check if we already have enough users
  const existingUserCount = await prisma.user.count();
  console.log(`Found ${existingUserCount} existing users`);
  
  if (existingUserCount < USERS_COUNT) {
    // Only create additional users if we don't have enough
    const usersToCreate = USERS_COUNT - existingUserCount;
    console.log(`Creating ${usersToCreate} additional users...`);
    
    // Define user data without preferences
    const usersData = [];
    
    for (let i = 0; i < usersToCreate; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const companyName = faker.number.int({ min: 0, max: 10 }) > 7 ? faker.company.name() : null;
      
      usersData.push({
        email: faker.internet.email({ firstName, lastName }),
        password: hashedPassword, // All users have the same password: admin123
        firstName,
        lastName,
        phone: faker.phone.number({ style: 'international' }),
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        postalCode: faker.location.zipCode(),
        country: 'Netherlands',
        bio: faker.lorem.paragraph(),
        companyName,
        kvkNumber: companyName ? faker.number.int({ min: 10000000, max: 99999999 }).toString() : null,
        vatNumber: companyName ? `NL${faker.number.int({ min: 100000000, max: 999999999 })}B01` : null,
        isVerified: faker.datatype.boolean(0.9),
        role: faker.helpers.arrayElement([UserRole.USER, UserRole.USER, UserRole.USER, UserRole.LESSOR]),
        emailNotifications: faker.datatype.boolean(0.8),
        pushNotifications: faker.datatype.boolean(0.7),
        lastLogin: faker.date.recent(),
        memberSince: faker.date.past()
      });
    }
    
    if (usersData.length > 0) {
      // Create users with createMany
      await prisma.user.createMany({
        data: usersData,
        skipDuplicates: true,
      });
    }
  } else {
    console.log("Already have enough users, skipping user creation");
  }
  
  // Get all users to create preferences
  const allUsers = await prisma.user.findMany();
  
  // Create preferences for users that don't have them yet
  for (const user of allUsers) {
    // Check if user already has preferences
    const existingPreference = await prisma.userPreference.findUnique({
      where: { userId: user.id }
    });
    
    if (!existingPreference) {
      console.log(`Creating preferences for user ${user.id}`);
      await prisma.userPreference.create({
        data: {
          darkMode: faker.datatype.boolean(0.3),
          notifyBeforeRental: faker.helpers.arrayElement([12, 24, 48]),
          notifyBeforeReturn: faker.helpers.arrayElement([12, 24, 48]),
          defaultSearchRadius: faker.helpers.arrayElement([10, 25, 50, 100]),
          hideEmail: faker.datatype.boolean(0.2),
          hidePhone: faker.datatype.boolean(0.3),
          userId: user.id
        }
      });
    }
  }
  
  return allUsers;
}

async function createMainCategories() {
  const mainCategories = [
    { 
      name: 'Klein', 
      description: 'Kleine aanhangers, geschikt voor lichte ladingen en eenvoudig transport',
      icon: 'small_trailer_icon' 
    },
    { 
      name: 'Gemiddeld', 
      description: 'Middelgrote aanhangers voor diverse doeleinden',
      icon: 'medium_trailer_icon' 
    },
    { 
      name: 'Groot', 
      description: 'Grote aanhangers voor zware ladingen en professioneel gebruik',
      icon: 'large_trailer_icon' 
    },
  ];
  
  // Check for existing categories
  const existingCategories = await prisma.mainCategory.findMany();
  
  if (existingCategories.length > 0) {
    console.log('Main categories already exist, using existing ones:', existingCategories.map(c => ({ id: c.id, name: c.name })));
    return existingCategories;
  }
  
  // Create categories one by one to ensure we get the IDs back
  const createdCategories = [];
  
  for (const category of mainCategories) {
    const created = await prisma.mainCategory.create({
      data: category
    });
    createdCategories.push(created);
  }
  
  console.log('Created main categories:', createdCategories.map(c => ({ id: c.id, name: c.name })));
  
  return createdCategories;
}

async function createTrailerCategories(mainCategories) {
  // First, make sure we have the main categories
  if (!mainCategories || mainCategories.length < 3) {
    console.error('Main categories not properly defined');
    return [];
  }
  
  // Map the categories by name for easier access
  const mainCategoryMap = {};
  for (const category of mainCategories) {
    mainCategoryMap[category.name] = category;
  }
  
  console.log('Main category map:', Object.keys(mainCategoryMap));
  
  // Ensure all required categories exist
  if (!mainCategoryMap['Klein'] || !mainCategoryMap['Gemiddeld'] || !mainCategoryMap['Groot']) {
    console.error('Missing required main categories');
    return [];
  }

  // Check for existing trailer categories
  const existingCategories = await prisma.trailerCategory.findMany({
    include: { mainCategory: true }
  });
  
  if (existingCategories.length > 0) {
    console.log('Trailer categories already exist, using existing ones:', 
      existingCategories.map(c => ({ id: c.id, name: c.name })));
    return existingCategories;
  }

  /**
   * IMPORTANT: Multilingual Trailer Type Definitions
   * 
   * The categories defined below must be consistent with the frontend trailer type definitions
   * in the following files:
   * 
   * 1. src/lib/utils/trailerTypes.tsx - Contains the primary trailer type definitions with translations
   * 2. src/lib/trailer-type-mapper.tsx - Maps UI-friendly names to database enum values
   * 3. public/locales/[language]/trailerTypes.json - Contains additional UI translations
   * 
   * The type names MUST match exactly with those defined in the frontend for filtering to work correctly.
   * The frontend handles translations separately through the i18n system.
   * 
   * If you add/modify trailer types here, you MUST update the corresponding frontend files.
   */

  // Define categories based on trailer types from trailerTypes.tsx
  // These exact names are used in the UI and translations
  // The names must match exactly with those defined in /src/lib/utils/trailerTypes.tsx
  const categories = [
    { 
      name: 'Open aanhanger', 
      description: 'Open aanhangers beschikken over een open laadvloer zonder zij- of achterwanden. Dit maakt ze bijzonder veelzijdig voor het vervoeren van grote, onregelmatige of zware ladingen zoals tuinmaterialen, bouwafval of meubels.',
      mainCategoryId: mainCategoryMap['Klein'].id 
    },
    { 
      name: 'Gesloten aanhanger', 
      description: 'Gesloten aanhangers bieden volledige bescherming tegen weersinvloeden en diefstal. Ideaal voor het veilig vervoeren van waardevolle of kwetsbare goederen zoals apparatuur, meubels of dozen.',
      mainCategoryId: mainCategoryMap['Gemiddeld'].id 
    },
    { 
      name: 'Autotransporter', 
      description: 'Autotransporters zijn speciaal ontworpen voor het vervoeren van auto\'s of andere voertuigen. Ze beschikken over oprijplaten en wielstoppers om het voertuig veilig te laden en vast te zetten.',
      mainCategoryId: mainCategoryMap['Groot'].id 
    },
    { 
      name: 'Motorfiets aanhanger', 
      description: 'Motorfiets aanhangers zijn speciaal ontworpen voor het veilig vervoeren van één of meerdere motoren. Ze bevatten vaak oprijgoten en vastzetsystemen voor stabiliteit tijdens het vervoer.',
      mainCategoryId: mainCategoryMap['Klein'].id 
    },
    { 
      name: 'Boottrailer', 
      description: 'Boottrailers zijn speciaal ontworpen voor het vervoer van boten en waterscooters. Ze zijn voorzien van rollers of steunen om het laden en lossen bij een helling eenvoudig te maken.',
      mainCategoryId: mainCategoryMap['Gemiddeld'].id 
    },
    { 
      name: 'Paardentrailer', 
      description: 'Paardentrailers zijn ontworpen voor het veilig en comfortabel vervoeren van paarden. Ze beschikken over ventilatie, rubberen vloeren en een stabiele constructie.',
      mainCategoryId: mainCategoryMap['Groot'].id 
    },
    { 
      name: 'Kipper', 
      description: 'Een kipper heeft een kiepfunctie waarmee je eenvoudig los materiaal zoals zand, grind of puin kunt storten. Ze worden veel gebruikt in de bouw en landschapsinrichting.',
      mainCategoryId: mainCategoryMap['Gemiddeld'].id 
    },
    { 
      name: 'Bagage aanhanger', 
      description: 'Bagage aanhangers zijn compacte en gesloten aanhangers, perfect voor vakanties, kampeertrips of extra opslag tijdens verhuizingen. Ze zijn eenvoudig aan te koppelen en wegen relatief weinig.',
      mainCategoryId: mainCategoryMap['Klein'].id 
    },
    { 
      name: 'Verkoopwagen', 
      description: 'Verkoopwagens zijn aanhangers ingericht als mobiele verkooppunten, zoals foodtrucks, marktkramen of promotiestands. Ze zijn vaak voorzien van elektriciteit, uitklapbare zijdes of toonbanken.',
      mainCategoryId: mainCategoryMap['Groot'].id 
    },
    { 
      name: 'Flatbed aanhanger', 
      description: 'Flatbed aanhangers hebben een vlakke laadvloer zonder opstaande randen, wat ze ideaal maakt voor het vervoeren van brede en zware lading zoals pallets, machines of bouwmaterialen.',
      mainCategoryId: mainCategoryMap['Groot'].id 
    },
    { 
      name: 'Fietsen aanhanger', 
      description: 'Fietsen aanhangers zijn ontworpen voor het vervoeren van meerdere fietsen, vaak met gootprofielen en bevestigingsbeugels. Ideaal voor fietsuitjes of sportevenementen.',
      mainCategoryId: mainCategoryMap['Klein'].id 
    },
    { 
      name: 'Schamel aanhangers', 
      description: 'Een schamelaanhanger is voorzien van een draaibare dissel en wordt vaak gebruikt bij lange of zware transporten, zoals boomstammen of buizen. Door de scharnierende as is deze wendbaarder in bochten.',
      mainCategoryId: mainCategoryMap['Groot'].id 
    },
    { 
      name: 'Plateauwagens', 
      description: 'Plateauwagens hebben een laadvloer boven de wielen waardoor ze aan alle zijden toegankelijk zijn. Ideaal voor het vervoeren van grote of brede objecten zoals bouwmateriaal of pallets.',
      mainCategoryId: mainCategoryMap['Gemiddeld'].id 
    },
    { 
      name: 'Overig', 
      description: 'Deze categorie is bedoeld voor aanhangers die niet direct in een van de standaard types vallen. Denk aan speciale constructies, eigenbouw trailers of nichetoepassingen.',
      mainCategoryId: mainCategoryMap['Gemiddeld'].id 
    }
  ];
  
  // Create categories one by one to ensure we get the IDs back
  const createdCategories = [];
  
  for (const category of categories) {
    // Check if this category already exists
    const existingCategory = await prisma.trailerCategory.findFirst({
      where: { name: category.name }
    });
    
    if (existingCategory) {
      console.log(`Category ${category.name} already exists, updating it...`);
      // Update the existing category to ensure it has the latest description and mainCategoryId
      const updated = await prisma.trailerCategory.update({
        where: { id: existingCategory.id },
        data: {
          description: category.description,
          mainCategoryId: category.mainCategoryId
        }
      });
      createdCategories.push(updated);
    } else {
      console.log(`Creating new category: ${category.name}`);
      const created = await prisma.trailerCategory.create({
        data: category
      });
      createdCategories.push(created);
    }
  }
  
  console.log('Created/Updated trailer categories:', createdCategories.map(c => ({ id: c.id, name: c.name, mainCategoryId: c.mainCategoryId })));
  
  return createdCategories;
}


async function createTrailers(users, categories) {
  // Check if we already have trailers
  const existingTrailersCount = await prisma.trailer.count();
  
  if (existingTrailersCount >= TRAILERS_COUNT) {
    console.log(`Already have ${existingTrailersCount} trailers, skipping trailer creation`);
    return await prisma.trailer.findMany();
  }
  
  const lessors = users.filter(user => user.role === 'LESSOR' || user.role === 'ADMIN');
  
  if (lessors.length === 0) {
    console.error('No lessors found to assign trailers to');
    return [];
  }
  
  const trailersToCreate = TRAILERS_COUNT - existingTrailersCount;
  console.log(`Creating ${trailersToCreate} additional trailers...`);
  
  const trailerData = [];
  
  // Get all trailer categories and their main categories
  const trailerCategoriesWithMain = await prisma.trailerCategory.findMany({
    include: {
      mainCategory: true
    }
  });
  
  console.log('Trailer categories with main:', trailerCategoriesWithMain.map(c => ({
    id: c.id,
    name: c.name,
    mainCategoryName: c.mainCategory?.name
  })));
  
  // Group categories by main category
  const kleinCategories = trailerCategoriesWithMain.filter(c => c.mainCategory?.name === 'Klein');
  const gemiddeldCategories = trailerCategoriesWithMain.filter(c => c.mainCategory?.name === 'Gemiddeld');
  const grootCategories = trailerCategoriesWithMain.filter(c => c.mainCategory?.name === 'Groot');
  
  console.log(`Category counts: Klein=${kleinCategories.length}, Gemiddeld=${gemiddeldCategories.length}, Groot=${grootCategories.length}`);
  
  for (let i = 0; i < trailersToCreate; i++) {
    const owner = randomItem(lessors);
    
    // Determine size category based on distribution (30% klein, 40% gemiddeld, 30% groot)
    let categoryPool;
    const sizeValue = faker.number.int({ min: 1, max: 10 });
    
    if (sizeValue <= 3) {
      categoryPool = kleinCategories;
    } else if (sizeValue <= 7) {
      categoryPool = gemiddeldCategories;
    } else {
      categoryPool = grootCategories;
    }
    
    // Fallback if the category pool is empty
    if (!categoryPool || categoryPool.length === 0) {
      categoryPool = trailerCategoriesWithMain;
    }
    
    const category = randomItem(categoryPool);
    
    // Adjust type based on category for better consistency
    let type;
    
    /**
     * CRITICAL: Type Mapping for Frontend Compatibility
     * 
     * This mapping MUST be kept in sync with the frontend trailer type definitions in:
     * - src/lib/trailer-type-mapper.tsx (mapTrailerTypeToEnum and mapEnumToTrailerType functions)
     * - src/lib/utils/trailerTypes.tsx (trailerTypes array with multilingual support)
     * 
     * The translations for each trailer type are managed separately in the frontend through:
     * - public/locales/[language]/trailerTypes.json
     * 
     * This ensures that filtering and displaying trailers works correctly across languages.
     */
    
    // Direct 1:1 mapping between category name and trailer type enum
    // These should match exactly with the TrailerType enum from prisma/schema.prisma
    // and use the same names as in trailer-type-mapper.tsx and trailerTypes.tsx
    switch (category.name) {
      case 'Open aanhanger':
        type = TrailerType.OPEN_AANHANGER;
        break;
      case 'Gesloten aanhanger':
        type = TrailerType.GESLOTEN_AANHANGER;
        break;
      case 'Autotransporter':
        type = TrailerType.AUTOTRANSPORTER;
        break;
      case 'Motorfiets aanhanger':
        type = TrailerType.MOTORFIETS_AANHANGER;
        break;
      case 'Boottrailer':
        type = TrailerType.BOOTTRAILER;
        break;
      case 'Paardentrailer':
        type = TrailerType.PAARDENTRAILER;
        break;
      case 'Kipper':
        type = TrailerType.KIPPER;
        break;
      case 'Bagage aanhanger':
        type = TrailerType.BAGAGE_AANHANGER;
        break;
      case 'Verkoopwagen':
        type = TrailerType.VERKOOPWAGEN;
        break;
      case 'Flatbed aanhanger':
        type = TrailerType.FLATBED_AANHANGER;
        break;
      case 'Fietsen aanhanger':
        type = TrailerType.FIETSEN_AANHANGER;
        break;
      case 'Schamel aanhangers': // Now using the exact plural form from the frontend
        type = TrailerType.SCHAMEL_AANHANGERS;
        break;
      case 'Plateauwagens': // Now using the exact plural form from the frontend
        type = TrailerType.PLATEAUWAGENS;
        break;
      case 'Overig':
        type = TrailerType.OVERIG;
        break;
      default:
        // This is a fallback, but should never be used now that we have direct mappings
        type = TrailerType.OVERIG; // Default to OVERIG instead of random selection for consistency
    }
    
    // Adjust dimensions and weight based on main category
    let weight, length, width, height, capacity;
    const mainCategoryName = category.mainCategory?.name || 'Gemiddeld'; // Default to Gemiddeld if no main category
    
    if (mainCategoryName === 'Klein') {
      weight = faker.number.float({ min: 300, max: 750, fractionDigits: 1 });
      // Convert meters to cm by multiplying by 100
      length = faker.number.int({ min: 200, max: 350 }); // 200-350 cm
      width = faker.number.int({ min: 120, max: 180 }); // 120-180 cm
      height = faker.number.int({ min: 80, max: 150 }); // 80-150 cm
      capacity = faker.number.float({ min: 0.3, max: 0.8, fractionDigits: 1 });
    } else if (mainCategoryName === 'Gemiddeld') {
      weight = faker.number.float({ min: 750, max: 1500, fractionDigits: 1 });
      // Convert meters to cm by multiplying by 100
      length = faker.number.int({ min: 350, max: 500 }); // 350-500 cm
      width = faker.number.int({ min: 180, max: 220 }); // 180-220 cm
      height = faker.number.int({ min: 150, max: 220 }); // 150-220 cm
      capacity = faker.number.float({ min: 0.8, max: 1.5, fractionDigits: 1 });
    } else { // Groot
      weight = faker.number.float({ min: 1500, max: 3500, fractionDigits: 1 });
      // Convert meters to cm by multiplying by 100
      length = faker.number.int({ min: 500, max: 700 }); // 500-700 cm
      width = faker.number.int({ min: 220, max: 250 }); // 220-250 cm
      height = faker.number.int({ min: 220, max: 300 }); // 220-300 cm
      capacity = faker.number.float({ min: 1.5, max: 3, fractionDigits: 1 });
    }
    
    const manufacturer = faker.vehicle.manufacturer();
    const model = faker.string.alphanumeric(5).toUpperCase();
    const year = faker.number.int({ min: 2010, max: 2023 });
    
    // Price should correlate with size
    const pricePerDay = mainCategoryName === 'Klein' 
      ? faker.number.float({ min: 20, max: 40, fractionDigits: 2 })
      : mainCategoryName === 'Gemiddeld'
        ? faker.number.float({ min: 40, max: 70, fractionDigits: 2 })
        : faker.number.float({ min: 70, max: 100, fractionDigits: 2 });
    
    // Genereer random coördinaten in Nederland
    const latitude = faker.number.float({ min: 51.4, max: 53.5, fractionDigits: 6 });
    const longitude = faker.number.float({ min: 3.3, max: 7.2, fractionDigits: 6 });
    
    const features = randomItems([
      'Afsluitbaar', 'Met huif', 'Geremd', 'Dubbele as', 'LED verlichting',
      'Reservewiel', 'Ladder', 'Achterklep', 'Huif', 'Netjes',
      'Zijborden', 'Uitschuifbaar', 'Neuswiel', 'Disselslot'
    ], 2, 6);
    
    // Generate a more descriptive title based on the trailer category
    const generateTitle = () => {
      // Include specific features in the title based on trailer type
      switch (type) {
        case TrailerType.OPEN_AANHANGER:
          return `${manufacturer} ${category.name} ${mainCategoryName === 'Klein' ? 'Ongeremd' : 'Geremd'} ${year}`;
        case TrailerType.GESLOTEN_AANHANGER:
          return `${manufacturer} ${category.name} met ${faker.helpers.arrayElement(['Huif', 'Dekzeil', 'Hardtop'])} ${year}`;
        case TrailerType.AUTOTRANSPORTER:
          return `${manufacturer} ${category.name} met Oprijplaat ${year}`;
        case TrailerType.PAARDENTRAILER:
          return `${manufacturer} ${category.name} ${faker.helpers.arrayElement(['1-paard', '2-paards', '3-paards'])} ${year}`;
        case TrailerType.BOOTTRAILER:
          return `${manufacturer} ${category.name} ${faker.helpers.arrayElement(['Tot 6m', 'Tot 8m', 'Groot formaat'])} ${year}`;
        case TrailerType.KIPPER:
          return `${manufacturer} ${category.name} ${mainCategoryName === 'Groot' ? 'Dubbelasser' : 'Enkelasser'} ${year}`;
        default:
          return `${manufacturer} ${category.name} ${year}`;
      }
    };

    trailerData.push({
      title: generateTitle(),
      description: category.description,
      pricePerDay,
      pricePerWeek: pricePerDay * 6,
      pricePerMonth: pricePerDay * 22,
      securityDeposit: faker.number.float({ min: 50, max: 300, fractionDigits: 1 }),
      available: faker.datatype.boolean(0.9),
      location: faker.location.city(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      postalCode: faker.location.zipCode(),
      country: 'Netherlands',
      latitude,
      longitude,
      licensePlate: faker.vehicle.vrm(),
      cancellationPolicy: faker.helpers.arrayElement([
        'Flexibel: gratis annuleren tot 24 uur van tevoren',
        'Gemiddeld: gratis annuleren tot 3 dagen van tevoren',
        'Strikt: 50% restitutie tot 1 week van tevoren'
      ]),
      maxRentalDuration: faker.helpers.arrayElement([7, 14, 30, 90]),
      minRentalDuration: faker.helpers.arrayElement([1, 2, 3]),
      features,
      requiresDriversLicense: faker.datatype.boolean(0.8),
      includesInsurance: faker.datatype.boolean(0.7),
      homeDelivery: faker.datatype.boolean(0.4),
      deliveryFee: faker.datatype.boolean(0.4) ? faker.number.float({ min: 10, max: 50, fractionDigits: 3 }) : null,
      maxDeliveryDistance: faker.datatype.boolean(0.4) ? faker.number.int({ min: 10, max: 100 }) : null,
      instructions: `Lees deze instructies goed door voordat je deze ${category.name.toLowerCase()} gaat gebruiken. ${faker.lorem.paragraph()}`,
      views: faker.number.int({ min: 0, max: 1000 }),
      featured: faker.datatype.boolean(0.1),
      status: faker.helpers.arrayElement(['ACTIVE', 'ACTIVE', 'ACTIVE', 'MAINTENANCE', 'DEACTIVATED']),
      type,
      manufacturer,
      model,
      year,
      weight,
      length,
      width,
      height,
      capacity,
      axles: mainCategoryName === 'Klein' ? 1 : faker.helpers.arrayElement([1, 2, 2, 3]),
      brakes: mainCategoryName === 'Klein' ? faker.datatype.boolean(0.5) : true,
      towBallWeight: faker.number.float({ min: 50, max: 150, fractionDigits: 1 }),
      maxSpeed: faker.helpers.arrayElement([80, 100, 130]),
      vinNumber: faker.vehicle.vin(),
      lastMaintenance: faker.date.past(),
      nextMaintenance: faker.date.future(),
      ownerId: owner.id,
      categoryId: category.id
    });
  }
  
  if (trailerData.length > 0) {
    await prisma.trailer.createMany({
      data: trailerData,
      skipDuplicates: true,
    });
    
    console.log(`Created ${trailerData.length} additional trailers`);
  }
  
  return await prisma.trailer.findMany();
}

async function createWeeklyAvailabilities(trailers) {
  // For each trailer, check if it already has availabilities
  for (const trailer of trailers) {
    const existingAvailabilities = await prisma.weeklyAvailability.findMany({
      where: { trailerId: trailer.id }
    });
    
    // If trailer already has availabilities for all days, skip it
    if (existingAvailabilities.length === 7) { // 7 days in a week
      console.log(`Trailer ${trailer.id} already has weekly availabilities, skipping`);
      continue;
    }
    
    // Create availabilities for days that don't have them yet
    const existingDays = existingAvailabilities.map(a => a.day);
    const daysToCreate = Object.values(DayOfWeek).filter(day => !existingDays.includes(day));
    
    if (daysToCreate.length === 0) {
      continue; // Skip if all days already exist
    }
    
    console.log(`Creating ${daysToCreate.length} weekly availabilities for trailer ${trailer.id}`);
    
    const availabilityData = [];
    
    for (const day of daysToCreate) {
      // Most days are available (90% chance)
      const isAvailable = faker.datatype.boolean(0.9);
      
      // Generate 1-3 time slots per day
      const numTimeSlots = isAvailable ? faker.number.int({ min: 1, max: 3 }) : 0;
      
      // Default time slots
      const defaultTimeSlots = [
        { start: "09:00", end: "12:00" },
        { start: "14:00", end: "17:00" },
        { start: "18:00", end: "20:00" }
      ];
      
      // Use only the number of time slots we want
      const dayTimeSlots = defaultTimeSlots.slice(0, numTimeSlots);
      
      availabilityData.push({
        day,
        available: isAvailable,
        // Time slot 1 (always present if available)
        timeSlot1Start: dayTimeSlots[0]?.start || null,
        timeSlot1End: dayTimeSlots[0]?.end || null,
        // Time slot 2 (sometimes present)
        timeSlot2Start: dayTimeSlots[1]?.start || null,
        timeSlot2End: dayTimeSlots[1]?.end || null,
        // Time slot 3 (rarely present)
        timeSlot3Start: dayTimeSlots[2]?.start || null,
        timeSlot3End: dayTimeSlots[2]?.end || null,
        trailerId: trailer.id
      });
    }
    
    if (availabilityData.length > 0) {
      await prisma.weeklyAvailability.createMany({
        data: availabilityData,
        skipDuplicates: true,
      });
    }
  }
}

async function createAvailabilityExceptions(trailers) {
  const exceptionData = [];
  
  for (const trailer of trailers) {
    // Maak 0-5 uitzonderingen per aanhanger
    const exceptionCount = faker.number.int({ min: 0, max: 5 });
    
    for (let i = 0; i < exceptionCount; i++) {
      const date = faker.date.future();
      const isMorningAvailable = faker.datatype.boolean();
      const isAfternoonAvailable = faker.datatype.boolean();
      const isEveningAvailable = faker.datatype.boolean();
      
      // Only sometimes override the time slots (30% chance)
      const overrideTimeSlots = faker.datatype.boolean(0.3);
      
      // Time slot overrides (only when overrideTimeSlots is true)
      const morningStart = overrideTimeSlots ? faker.helpers.arrayElement(['07:30', '08:30', '09:30']) : null;
      const morningEnd = overrideTimeSlots ? faker.helpers.arrayElement(['11:30', '12:30']) : null;
      
      const afternoonStart = overrideTimeSlots ? (morningEnd || faker.helpers.arrayElement(['12:00', '12:30', '13:00'])) : null;
      const afternoonEnd = overrideTimeSlots ? faker.helpers.arrayElement(['15:30', '16:30', '17:30']) : null;
      
      const eveningStart = overrideTimeSlots ? (afternoonEnd || faker.helpers.arrayElement(['17:00', '17:30', '18:00'])) : null;
      const eveningEnd = overrideTimeSlots ? faker.helpers.arrayElement(['20:30', '21:30', '22:30']) : null;
      
      exceptionData.push({
        date,
        morning: isMorningAvailable,
        afternoon: isAfternoonAvailable,
        evening: isEveningAvailable,
        // Add the new optional time fields for exceptions
        morningStart,
        morningEnd,
        afternoonStart,
        afternoonEnd,
        eveningStart,
        eveningEnd,
        trailerId: trailer.id
      });
    }
  }
  
  await prisma.availabilityException.createMany({
    data: exceptionData,
    skipDuplicates: true,
  });
}


async function createAccessories(trailers) {
  const accessoryOptions = [
    { name: 'Spanband set', description: 'Set van 4 spanbanden', price: 5 },
    { name: 'Reservewiel', description: 'Compleet gemonteerd reservewiel', price: 10 },
    { name: 'Afdekzeil', description: 'Waterdicht afdekzeil op maat', price: 7.5 },
    { name: 'Wielslot', description: 'Anti-diefstal wielslot', price: 5 },
    { name: 'Verloopstekker', description: '13-polig naar 7-polig', price: 2.5 },
    { name: 'Oprijplaten', description: 'Set aluminium oprijplaten', price: 15 },
    { name: 'Netspanners', description: 'Set van 10 netspanners', price: 3 },
    { name: 'Laadbrug', description: 'Extra stevige laadbrug', price: 12.5 },
    { name: 'Kogeldrukweger', description: 'Voor het meten van de kogeldruk', price: 5 },
    { name: 'GPS-tracker', description: 'Volg je aanhanger in real-time', price: 7.5 }
  ];
  
  const accessoryData = [];
  
  for (const trailer of trailers) {
    // 0-4 accessoires per aanhangwagen
    const count = faker.number.int({ min: 0, max: 4 });
    const selectedAccessories = randomItems(accessoryOptions, count, count);
    
    for (const accessory of selectedAccessories) {
      accessoryData.push({
        name: accessory.name,
        description: accessory.description,
        price: accessory.price,
        quantity: faker.number.int({ min: 1, max: 5 }),
        trailerId: trailer.id
      });
    }
  }
  
  await prisma.accessory.createMany({
    data: accessoryData,
    skipDuplicates: true,
  });
}

async function createFAQs() {
  const faqData = [
    {
      question: 'Hoe maak ik een account aan?',
      answer: 'Klik rechtsboven op "Registreren" en vul je gegevens in. Na verificatie van je e-mail kan je direct beginnen met het huren of verhuren van aanhangers.',
      category: 'Account'
    },
    {
      question: 'Wat heb ik nodig om een aanhanger te huren?',
      answer: 'Je hebt een geldig rijbewijs nodig en moet minimaal 21 jaar oud zijn. Voor sommige aanhangers is ook een BE-rijbewijs verplicht, dit staat aangegeven bij de aanhanger.',
      category: 'Huren'
    },
    {
      question: 'Hoe werkt het verhuren van mijn aanhanger?',
      answer: 'Maak een account aan, verificeer je identiteit, voeg je aanhanger toe met foto\'s en beschrijving, stel de beschikbaarheid en prijs in, en wacht op huurverzoeken.',
      category: 'Verhuren'
    },
    {
      question: 'Wat als de aanhanger beschadigd raakt?',
      answer: 'Alle huurovereenkomsten bevatten standaard een borg. Bij schade wordt eerst de borg gebruikt. Voor grotere schade raden we aan om een verzekering af te sluiten, wat via ons platform kan.',
      category: 'Verzekering'
    },
    {
      question: 'Kan ik een huur annuleren?',
      answer: 'Ja, maar de annuleringsvoorwaarden verschillen per verhuurder. Deze staan duidelijk aangegeven op de detailpagina van de aanhanger.',
      category: 'Huren'
    },
    {
      question: 'Hoe worden betalingen verwerkt?',
      answer: 'Alle betalingen lopen veilig via ons platform. We accepteren verschillende betaalmethoden zoals creditcard, iDEAL en PayPal.',
      category: 'Betalingen'
    },
    {
      question: 'Wanneer krijg ik mijn geld als verhuurder?',
      answer: 'Uitbetaling vindt plaats 24 uur na het succesvol afronden van de huurperiode, na bevestiging dat de aanhanger in goede staat is geretourneerd.',
      category: 'Betalingen'
    },
    {
      question: 'Kan de aanhanger worden bezorgd?',
      answer: 'Veel verhuurders bieden bezorging aan tegen een extra vergoeding. Dit staat aangegeven op de detailpagina van de aanhanger.',
      category: 'Huren'
    },
    {
      question: 'Wat als ik de aanhanger later terugbreng?',
      answer: 'Te laat terugbrengen resulteert in extra kosten. Het is beter om vooraf een verlenging aan te vragen als je de aanhanger langer nodig hebt.',
      category: 'Huren'
    },
    {
      question: 'Hoe werkt de verzekering?',
      answer: 'Je kunt kiezen uit verschillende verzekeringspakketten tijdens het boeken. De details en dekking staan duidelijk vermeld tijdens het boekingsproces.',
      category: 'Verzekering'
    }
  ];
  
  await prisma.fAQ.createMany({
    data: faqData,
    skipDuplicates: true,
  });
}

async function createTrailerFAQs(trailers) {
  const faqOptions = [
    { question: 'Heeft deze aanhanger een reservewiel?', answer: 'Ja, er wordt een reservewiel meegeleverd.' },
    { question: 'Heb ik een speciaal rijbewijs nodig?', answer: 'Voor deze aanhanger is een B-rijbewijs voldoende.' },
    { question: 'Moet ik de aanhanger vol getankt terugbrengen?', answer: 'Nee, deze aanhanger heeft geen eigen brandstoftank.' },
    { question: 'Kan ik de huurtijd verlengen?', answer: 'Ja, je kunt een verlengingsverzoek indienen via het platform.' },
    { question: 'Is thuisbezorging mogelijk?', answer: 'Ja, tegen een kleine meerprijs kan de aanhanger worden bezorgd en opgehaald.' },
    { question: 'Wat is het maximale laadvermogen?', answer: 'Het maximale laadvermogen staat vermeld in de specificaties van de aanhanger.' },
    { question: 'Mag ik ermee naar het buitenland?', answer: 'Ja, binnen de EU is dit toegestaan mits vooraf aangegeven.' },
    { question: 'Zijn er extra kosten voor verzekering?', answer: 'Basisverzekering is inbegrepen, uitgebreide verzekering is optioneel.' },
    { question: 'Wat moet ik doen bij pech onderweg?', answer: 'Neem direct contact op met de verhuurder en indien nodig met de wegenwacht.' },
    { question: 'Kan ik de aanhanger eerder ophalen?', answer: 'Afhankelijk van beschikbaarheid, neem contact op met de verhuurder.' }
  ];
  
  const faqData = [];
  
  for (const trailer of trailers) {
    // 2-5 FAQ's per aanhanger
    const count = faker.number.int({ min: 2, max: 5 });
    const selectedFAQs = randomItems(faqOptions, count, count);
    
    for (const faq of selectedFAQs) {
      faqData.push({
        question: faq.question,
        answer: faq.answer,
        trailerId: trailer.id
      });
    }
  }
  
  await prisma.trailerFAQ.createMany({
    data: faqData,
    skipDuplicates: true,
  });
}

async function createInsurances(users, trailers) {
  // Verzekeringen voor aanhangers
  const trailerInsuranceData = [];
  
  for (const trailer of trailers) {
    // Niet alle aanhangers hebben een verzekering
    if (faker.datatype.boolean(0.7)) {
      const insuranceType = randomItem(Object.values(InsuranceType));
      
      trailerInsuranceData.push({
        policyNumber: `P${faker.string.numeric(8)}`,
        provider: faker.helpers.arrayElement(['Centraal Beheer', 'Interpolis', 'OHRA', 'FBTO', 'Allianz']),
        type: insuranceType,
        coverageDetails: faker.lorem.paragraph(),
        startDate: faker.date.past(),
        endDate: faker.date.future(),
        premium: faker.number.float({ min: 20, max: 100, fractionDigits: 3 }),
        deductible: faker.number.float({ min: 100, max: 500, fractionDigits: 3 }),
        trailerId: trailer.id
      });
    }
  }
  
  // Verzekeringen voor gebruikers
  const userInsuranceData = [];
  
  for (const user of users) {
    // Niet alle gebruikers hebben een verzekering
    if (faker.datatype.boolean(0.3)) {
      const insuranceType = randomItem(Object.values(InsuranceType));
      
      userInsuranceData.push({
        policyNumber: `P${faker.string.numeric(8)}`,
        provider: faker.helpers.arrayElement(['Centraal Beheer', 'Interpolis', 'OHRA', 'FBTO', 'Allianz']),
        type: insuranceType,
        coverageDetails: faker.lorem.paragraph(),
        startDate: faker.date.past(),
        endDate: faker.date.future(),
        premium: faker.number.float({ min: 20, max: 100, fractionDigits: 3 }),
        deductible: faker.number.float({ min: 100, max: 500, fractionDigits: 3 }),
        userId: user.id
      });
    }
  }
  
  await prisma.insurance.createMany({
    data: [...trailerInsuranceData, ...userInsuranceData],
    skipDuplicates: true,
  });
  
  return await prisma.insurance.findMany();
}

async function createRentals(users, trailers, insurances) {
  const rentalData = [];
  
  // Bepaal een vaste lijst van gebruikers die huren
  const renters = users.filter(user => user.role === 'USER' || user.role === 'ADMIN');
  
  for (let i = 0; i < RENTALS_COUNT; i++) {
    const trailer = randomItem(trailers);
    const renter = randomItem(renters);
    const lessor = await prisma.user.findUnique({ where: { id: trailer.ownerId } });
    
    // Bepaal huurperiode
    const startDate = randomDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), new Date(Date.now() + 60 * 24 * 60 * 60 * 1000));
    const durationDays = faker.number.int({ min: 1, max: 14 });
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);
    
    // Bereken prijs
    const basePrice = trailer.pricePerDay * durationDays;
    const serviceFee = basePrice * 0.10; // 10% servicekosten
    const totalPrice = basePrice + serviceFee;
    
    // Bepaal status op basis van data
    let status;
    if (startDate > new Date()) {
      status = RentalStatus.PENDING;
      if (faker.datatype.boolean(0.8)) {
        status = RentalStatus.CONFIRMED;
      }
    } else if (endDate < new Date()) {
      status = faker.datatype.boolean(0.9) ? RentalStatus.COMPLETED : RentalStatus.CANCELLED;
    } else {
      status = RentalStatus.ACTIVE;
    }
    
    // Annuleringsreden indien geannuleerd
    const cancellationReason = status === RentalStatus.CANCELLED 
      ? faker.helpers.arrayElement([
          'Andere plannen gemaakt',
          'Aanhanger niet meer nodig',
          'Te duur',
          'Betere optie gevonden',
          'Verhuurder reageerde niet'
        ]) 
      : null;
    
    const cancellationDate = status === RentalStatus.CANCELLED 
      ? faker.date.between({ from: startDate.getTime() - 7 * 24 * 60 * 60 * 1000, to: startDate }) 
      : null;
    
    // Werkelijke retourdatum (soms te laat)
    const actualReturnDate = status === RentalStatus.COMPLETED 
      ? faker.datatype.boolean(0.2) 
        ? new Date(endDate.getTime() + faker.number.int({ min: 1, max: 48 }) * 60 * 60 * 1000) 
        : endDate
      : null;
    
    // Kies een verzekering als die beschikbaar is
    const trailerInsurance = insurances.find(i => i.trailerId === trailer.id);
    const insuranceId = trailerInsurance ? trailerInsurance.id : null;
    
    // Bepaal of thuisbezorging nodig is
    const needsDelivery = faker.datatype.boolean(0.3);
    const deliveryFee = needsDelivery ? faker.number.float({ min: 10, max: 50, fractionDigits: 3 }) : null;
    
    // Voeg de huur toe
    rentalData.push({
      startDate,
      endDate,
      status,
      totalPrice,
      serviceFee,
      insuranceFee: insuranceId ? faker.number.float({ min: 5, max: 25, fractionDigits: 3 }) : null,
      deliveryFee,
      securityDeposit: faker.number.float({ min: 50, max: 300, fractionDigits: 3 }),
      pickupLocation: needsDelivery ? renter.address : trailer.address,
      returnLocation: needsDelivery ? renter.address : trailer.address,
      pickupTime: startDate,
      returnTime: endDate,
      actualReturnDate,
      needsDelivery,
      cancellationReason,
      cancellationDate,
      specialNotes: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null,
      termsAccepted: true,
      trailerId: trailer.id,
      renterId: renter.id,
      lessorId: lessor?.id || trailer.ownerId,
      insuranceId,
      couponId: null, // We voegen later coupons toe
    });
  }
  
  await prisma.rental.createMany({
    data: rentalData,
    skipDuplicates: true,
  });
  
  // Haal alle huurovereenkomsten op voor gebruik in andere seed functies
  const rentals = await prisma.rental.findMany();
  
  // Maak checklists voor de rentals
  await createRentalChecklists(rentals);
  
  return rentals;
}

async function createRentalChecklists(rentals) {
  const pickupChecklistItems = [
    'Algemene staat gecontroleerd',
    'Lichten werken',
    'Banden in goede staat',
    'Reservewiel aanwezig',
    'Kentekenplaat leesbaar',
    'Spanbanden aanwezig',
    'Vergrendelingen werken',
    'Disselslot aanwezig',
    'Kentekenbewijs gecontroleerd',
    'Geen zichtbare schade'
  ];
  
  const returnChecklistItems = [
    'Algemene staat gecontroleerd',
    'Lichten werken',
    'Banden in goede staat',
    'Reservewiel aanwezig',
    'Kentekenplaat leesbaar',
    'Spanbanden aanwezig',
    'Vergrendelingen werken',
    'Disselslot aanwezig',
    'Geen nieuwe schade',
    'Schoon teruggebracht'
  ];
  
  const checklistData = [];
  
  for (const rental of rentals) {
    // Alleen checklists voor niet-geannuleerde huurovereenkomsten
    if (rental.status !== RentalStatus.CANCELLED) {
      // Pickup checklist
      if (rental.status !== RentalStatus.PENDING) {
        for (const item of pickupChecklistItems) {
          checklistData.push({
            itemName: item,
            checked: true,
            note: faker.datatype.boolean(0.2) ? faker.lorem.sentence() : null,
            photo: faker.datatype.boolean(0.3) ? faker.image.url() : null,
            pickupRentalId: rental.id
          });
        }
      }
      
      // Return checklist (alleen voor voltooide verhuur)
      if (rental.status === RentalStatus.COMPLETED) {
        for (const item of returnChecklistItems) {
          checklistData.push({
            itemName: item,
            checked: true,
            note: faker.datatype.boolean(0.2) ? faker.lorem.sentence() : null,
            photo: faker.datatype.boolean(0.3) ? faker.image.url() : null,
            returnRentalId: rental.id
          });
        }
      }
    }
  }
  
  await prisma.rentalChecklistItem.createMany({
    data: checklistData,
    skipDuplicates: true,
  });
}

async function createPayments(rentals) {
  const paymentData = [];
  
  for (const rental of rentals) {
    // Alleen betalingen voor confirmed of voltooide verhuur
    if (rental.status !== RentalStatus.PENDING && rental.status !== RentalStatus.CANCELLED) {
      const now = new Date();
      const isCompleted = rental.status === RentalStatus.COMPLETED || 
                          (rental.status === RentalStatus.CONFIRMED && rental.startDate < now);
      
      // Bepaal betaalmethode
      const paymentMethod = randomItem(Object.values(PaymentMethod));
      
      // Bepaal betalingstatus
      const paymentStatus = isCompleted ? PaymentStatus.COMPLETED : PaymentStatus.PENDING;
      
      // Bepaal betalingsdatum
      const paymentDate = isCompleted 
        ? randomDate(new Date(rental.createdAt), new Date(rental.startDate))
        : null;
      
      paymentData.push({
        amount: rental.totalPrice,
        currency: 'EUR',
        status: paymentStatus,
        paymentMethod,
        externalTransactionId: faker.string.alphanumeric(16),
        invoiceNumber: `INV-${faker.string.numeric(6)}`,
        receiptUrl: faker.datatype.boolean(0.7) ? faker.image.url() : null,
        paymentDate,
        createdAt: rental.createdAt,
        rentalId: rental.id
      });
    }
  }
  
  await prisma.payment.createMany({
    data: paymentData,
    skipDuplicates: true,
  });
}

async function createReviews(users, trailers, rentals) {
  const reviewData = [];
  
  // Filter op voltooide huurovereenkomsten
  const completedRentals = rentals.filter(rental => rental.status === RentalStatus.COMPLETED);
  
  for (const rental of completedRentals) {
    // Niet alle verhuur krijgt een recensie
    if (faker.datatype.boolean(0.7)) {
      // Recensie voor de aanhanger
      const trailerRating = faker.number.int({ min: 3, max: 5 });
      const cleanliness = faker.number.int({ min: 3, max: 5 });
      const maintenance = faker.number.int({ min: 3, max: 5 });
      const valueForMoney = faker.number.int({ min: 2, max: 5 });
      const accuracy = faker.number.int({ min: 3, max: 5 });
      
      reviewData.push({
        rating: trailerRating,
        title: faker.lorem.sentence(5),
        comment: faker.lorem.paragraph(),
        cleanliness,
        maintenance,
        valueForMoney,
        accuracy,
        recommended: trailerRating >= 4,
        photos: JSON.stringify([]), // Add this
        trailerId: rental.trailerId,
        reviewerId: rental.renterId,
        createdAt: new Date(rental.endDate.getTime() + faker.number.int({ min: 1, max: 7 }) * 24 * 60 * 60 * 1000)
      });
      
      // Recensie voor de verhuurder
      if (faker.datatype.boolean(0.5)) {
        const lessorId = rental.lessorId || await prisma.trailer.findUnique({ 
          where: { id: rental.trailerId },
          select: { ownerId: true }
        }).then(trailer => trailer?.ownerId);
        
        if (lessorId) {
          const userRating = faker.number.int({ min: 3, max: 5 });
          const communication = faker.number.int({ min: 3, max: 5 });
          
          reviewData.push({
            rating: userRating,
            title: faker.lorem.sentence(5),
            comment: faker.lorem.paragraph(),
            communication,
            recommended: userRating >= 4,
            reviewedUserId: lessorId,
            reviewerId: rental.renterId,
            createdAt: new Date(rental.endDate.getTime() + faker.number.int({ min: 1, max: 7 }) * 24 * 60 * 60 * 1000)
          });
        }
      }
      
      // Recensie voor de huurder (van de verhuurder)
      if (faker.datatype.boolean(0.4)) {
        const lessorId = rental.lessorId || await prisma.trailer.findUnique({ 
          where: { id: rental.trailerId },
          select: { ownerId: true }
        }).then(trailer => trailer?.ownerId);
        
        if (lessorId) {
          const renterRating = faker.number.int({ min: 3, max: 5 });
          
          reviewData.push({
            rating: renterRating,
            title: faker.lorem.sentence(5),
            comment: faker.lorem.paragraph(),
            recommended: renterRating >= 4,
            reviewedUserId: rental.renterId,
            reviewerId: lessorId,
            createdAt: new Date(rental.endDate.getTime() + faker.number.int({ min: 1, max: 7 }) * 24 * 60 * 60 * 1000)
          });
        }
      }
    }
  }
  
  // Aanvullende recensies
  for (let i = 0; i < REVIEWS_COUNT - reviewData.length; i++) {
    const isTrailerReview = faker.datatype.boolean(0.7);
    
    if (isTrailerReview) {
      // Recensie voor willekeurige aanhanger
      const trailer = randomItem(trailers);
      const reviewer = randomItem(users.filter(u => u.id !== trailer.ownerId));
      
      const trailerRating = faker.number.int({ min: 2, max: 5 });
      
      reviewData.push({
        rating: trailerRating,
        title: faker.lorem.sentence(5),
        comment: faker.lorem.paragraph(),
        cleanliness: faker.number.int({ min: 2, max: 5 }),
        maintenance: faker.number.int({ min: 2, max: 5 }),
        valueForMoney: faker.number.int({ min: 2, max: 5 }),
        accuracy: faker.number.int({ min: 2, max: 5 }),
        recommended: trailerRating >= 4,
        trailerId: trailer.id,
        reviewerId: reviewer.id,
        createdAt: faker.date.recent({ days: 90 })
      });
    } else {
      // Recensie voor willekeurige gebruiker
      const reviewedUser = randomItem(users);
      let reviewer;
      
      do {
        reviewer = randomItem(users);
      } while (reviewer.id === reviewedUser.id);
      
      const userRating = faker.number.int({ min: 3, max: 5 });
      
      reviewData.push({
        rating: userRating,
        title: faker.lorem.sentence(5),
        comment: faker.lorem.paragraph(),
        communication: faker.number.int({ min: 3, max: 5 }),
        recommended: userRating >= 4,
        reviewedUserId: reviewedUser.id,
        photos: JSON.stringify([]), // Add this fiel
        reviewerId: reviewer.id,
        createdAt: faker.date.recent({ days: 90 })
      });
    }
  }
  
  await prisma.review.createMany({
    data: reviewData,
    skipDuplicates: true,
  });
}

async function createFavorites(users, trailers) {
  const favoriteData = [];
  
  for (const user of users) {
    // 0-5 favorieten per gebruiker
    const count = faker.number.int({ min: 0, max: 5 });
    const selectedTrailers = randomItems(trailers, count, count);
    
    for (const trailer of selectedTrailers) {
      // Sla over als de gebruiker de eigenaar is
      if (user.id === trailer.ownerId) continue;
      
      favoriteData.push({
        note: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null,
        userId: user.id,
        trailerId: trailer.id
      });
    }
  }
  
  await prisma.favorite.createMany({
    data: favoriteData,
    skipDuplicates: true,
  });
}

// Updated createMedia function to use trailerImages array
async function createMedia(trailers) {
  const mediaData = [];
  
  for (const trailer of trailers) {
    // 2-6 afbeeldingen per aanhanger
    const imageCount = faker.number.int({ min: 2, max: 6 });
    
    for (let i = 0; i < imageCount; i++) {
      // Use images from the trailerImages array instead of random URLs
      const imageUrl = randomItem(trailerImages);
      
      mediaData.push({
        url: imageUrl,
        type: MediaType.IMAGE,
        title: faker.datatype.boolean(0.5) ? `Foto ${i+1} van ${trailer.title}` : null,
        description: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null,
        size: faker.number.int({ min: 100000, max: 5000000 }),
        order: i,
        trailerId: trailer.id
      });
    }
    
    // Soms een video
    if (faker.datatype.boolean(0.2)) {
      mediaData.push({
        url: faker.internet.url(),
        type: MediaType.VIDEO,
        title: `Video van ${trailer.title}`,
        description: faker.datatype.boolean(0.5) ? faker.lorem.sentence() : null,
        size: faker.number.int({ min: 1000000, max: 50000000 }),
        order: imageCount,
        trailerId: trailer.id
      });
    }
  }
  
  await prisma.media.createMany({
    data: mediaData,
    skipDuplicates: true,
  });
}

async function createChatMessages(users) {
  // Maak een paar chat rooms
  const chatRooms = [];
  
  for (let i = 0; i < 10; i++) {
    const chatRoom = await prisma.chatRoom.create({
      data: {
        name: faker.datatype.boolean(0.3) ? faker.lorem.words(3) : null,
      }
    });
    
    chatRooms.push(chatRoom);
    
    // Voeg 2-5 deelnemers toe aan elke chatroom
    const participants = randomItems(users, 2, 5);
    
    for (const participant of participants) {
      await prisma.chatRoomParticipant.create({
        data: {
          isAdmin: faker.datatype.boolean(0.2),
          chatRoomId: chatRoom.id,
          userId: participant.id
        }
      });
    }
    
    // Voeg 5-20 berichten toe aan elke chatroom
    const messageCount = faker.number.int({ min: 5, max: 20 });
    
    for (let j = 0; j < messageCount; j++) {
      const sender = randomItem(participants);
      
      await prisma.chatMessage.create({
        data: {
          // Limit the message length to a single sentence
          message: faker.lorem.sentence(),
          read: faker.datatype.boolean(0.8),
          attachments: faker.datatype.boolean(0.1) ? [faker.image.url()] : [],
          senderId: sender.id,
          chatRoomId: chatRoom.id
        }
      });
    }
  }
  
  // Maak directe berichten tussen gebruikers
const messageData = [];
for (let i = 0; i < 50; i++) {
  const sender = randomItem(users);
  let receiver;
  
  do {
    receiver = randomItem(users);
  } while (receiver.id === sender.id);
  
  messageData.push({
    // Use a single sentence instead of multiple sentences
    message: faker.lorem.sentence(),
    read: faker.datatype.boolean(0.7),
    attachments: JSON.stringify([]), // Add this
    senderId: sender.id,
    receiverId: receiver.id
  });
}
  
  await prisma.chatMessage.createMany({
    data: messageData,
    skipDuplicates: true,
  });
}

async function createDamageReportsAndClaims(users, trailers, rentals, insurances) {
  // Damage reports
  const damageReportData = [];
  
  // Voor een aantal verhuurde aanhangers, maak schaderapporten
  const completedRentals = rentals.filter(r => r.status === RentalStatus.COMPLETED);
  const rentalsWithDamage = randomItems(completedRentals, 5, 15); // 5-15 huurauto's hebben schade
  
  for (const rental of rentalsWithDamage) {
    const damageStatus = randomItem(Object.values(DamageStatus));
    
    damageReportData.push({
      description: faker.lorem.paragraph(),
      date: new Date(rental.endDate.getTime() + faker.number.int({ min: 0, max: 24 }) * 60 * 60 * 1000),
      location: faker.location.city(),
      damageStatus,
      photoUrls: [faker.image.url(), faker.image.url()],
      repairCost: damageStatus !== DamageStatus.NONE ? faker.number.float({ min: 50, max: 1000, fractionDigits: 3 }) : null,
      repairNotes: faker.datatype.boolean(0.7) ? faker.lorem.sentences(2) : null,
      resolved: faker.datatype.boolean(0.6),
      trailerId: rental.trailerId,
      rentalId: rental.id,
      reportedById: rental.lessorId
    });
  }
  
  // Ook nog wat willekeurige schaderapporten voor aanhangers
  for (let i = 0; i < 10; i++) {
    const trailer = randomItem(trailers);
    const damageStatus = randomItem(Object.values(DamageStatus));
    
    damageReportData.push({
      description: faker.lorem.paragraph(),
      date: faker.date.recent({ days: 90 }),
      location: faker.location.city(),
      damageStatus,
      photoUrls: [faker.image.url(), faker.image.url()],
      repairCost: damageStatus !== DamageStatus.NONE ? faker.number.float({ min: 50, max: 1000, fractionDigits: 3 }) : null,
      repairNotes: faker.datatype.boolean(0.7) ? faker.lorem.sentences(2) : null,
      resolved: faker.datatype.boolean(0.6),
      trailerId: trailer.id,
      rentalId: null,
      reportedById: trailer.ownerId
    });
  }
  
  await prisma.damageReport.createMany({
    data: damageReportData,
    skipDuplicates: true,
  });
  
  const damageReports = await prisma.damageReport.findMany();
  
  // Claims voor de schades
  const claimData = [];
  
  for (const report of damageReports) {
    // Niet voor elke schade wordt een claim ingediend
    if (faker.datatype.boolean(0.7) && report.damageStatus !== DamageStatus.NONE) {
      // Vind een bijpassende verzekering
      const trailerInsurance = insurances.find(i => i.trailerId === report.trailerId);
      
      if (trailerInsurance) {
        const claimStatus = faker.helpers.arrayElement(['PENDING', 'APPROVED', 'REJECTED', 'PAID']);
        
        claimData.push({
          claimNumber: `C${faker.string.numeric(6)}`,
          description: `Claim voor schade: ${report.description}`,
          date: new Date(report.date.getTime() + faker.number.int({ min: 1, max: 7 }) * 24 * 60 * 60 * 1000),
          status: claimStatus,
          amount: report.repairCost,
          evidenceUrls: JSON.stringify(report.photoUrls),
          notes: faker.datatype.boolean(0.5) ? faker.lorem.paragraph() : null,
          processedDate: claimStatus !== 'PENDING' ? faker.date.recent({ days: 30 }) : null,
          insuranceId: trailerInsurance.id,
          rentalId: report.rentalId,
          userId: report.reportedById,
          damageReportId: report.id
        });
      }
    }
  }
  
  await prisma.insuranceClaim.createMany({
    data: claimData,
    skipDuplicates: true,
  });
}

async function createBlogsAndCategories() {
  // Blog categorieën
  const categories = [
    { name: 'Tips & Tricks', slug: 'tips-tricks', description: 'Handige tips voor het gebruik van aanhangers' },
    { name: 'Nieuws', slug: 'nieuws', description: 'Laatste nieuws over ons platform en de verhuurmarkt' },
    { name: 'Handleidingen', slug: 'handleidingen', description: 'Stap-voor-stap gidsen voor verhuurders en huurders' },
    { name: 'Verhuurder worden', slug: 'verhuurder-worden', description: 'Alles over het verhuren van je aanhanger' },
    { name: 'Evenementen', slug: 'evenementen', description: 'Aankomende evenementen waarbij aanhangers handig kunnen zijn' }
  ];
  
  await prisma.blogCategory.createMany({
    data: categories,
    skipDuplicates: true,
  });
  
  const blogCategories = await prisma.blogCategory.findMany();
  
  // Blog posts
  const blogPosts = [
    {
      title: 'Hoe kies je de juiste aanhanger voor jouw klus?',
      slug: 'juiste-aanhanger-kiezen',
      content: faker.lorem.paragraphs(10),
      excerpt: 'Ontdek welke aanhanger het beste past bij jouw specifieke behoeften en projecten.',
      coverImage: faker.image.url(),
      published: true,
      publishedAt: faker.date.recent({ days: 30 }),
      authorName: 'Team Aanhangers',
      metaTitle: 'De juiste aanhanger kiezen voor jouw klus - Complete gids',
      metaDescription: 'Leer hoe je de perfecte aanhanger kiest voor jouw specifieke klus, inclusief tips over formaat, type en laadvermogen.'
    },
    {
      title: '5 tips om meer te verdienen met je aanhanger',
      slug: 'meer-verdienen-met-aanhanger',
      content: faker.lorem.paragraphs(8),
      excerpt: 'Maximaliseer je inkomsten door je aanhanger slim te verhuren met deze 5 bewezen tips.',
      coverImage: faker.image.url(),
      published: true,
      publishedAt: faker.date.recent({ days: 60 }),
      authorName: 'Mark Janssen',
      metaTitle: '5 bewezen tips om meer te verdienen met aanhangerverhuur',
      metaDescription: 'Ontdek hoe je je inkomsten kunt verhogen door je aanhanger slim te verhuren. 5 praktische tips voor verhuurders.'
    },
    {
      title: 'Veilig rijden met een aanhanger: wat je moet weten',
      slug: 'veilig-rijden-met-aanhanger',
      content: faker.lorem.paragraphs(12),
      excerpt: 'Essentiële veiligheidstips voor het rijden met een aanhanger, van belading tot remtechniek.',
      coverImage: faker.image.url(),
      published: true,
      publishedAt: faker.date.recent({ days: 90 }),
      authorName: 'Lisa de Vries',
      metaTitle: 'Veilig rijden met een aanhanger - Complete gids voor beginners',
      metaDescription: 'Leer hoe je veilig rijdt met een aanhanger. Praktische tips over belading, bochten nemen, achteruitrijden en meer.'
    },
    {
      title: 'De nieuwste regelgeving voor aanhangers in 2024',
      slug: 'regelgeving-aanhangers-2024',
      content: faker.lorem.paragraphs(7),
      excerpt: 'Blijf op de hoogte van de laatste wettelijke vereisten en regelgeving voor aanhangers.',
      coverImage: faker.image.url(),
      published: true,
      publishedAt: faker.date.recent({ days: 14 }),
      authorName: 'Team Aanhangers',
      metaTitle: 'Nieuwe regelgeving voor aanhangers in 2024 - Wat je moet weten',
      metaDescription: 'Een overzicht van de nieuwste wetgeving en regelgeving voor aanhangers die in 2024 van kracht wordt.'
    },
    {
      title: 'Onderhoudstips om je aanhanger in topconditie te houden',
      slug: 'onderhoudstips-aanhanger',
      content: faker.lorem.paragraphs(9),
      excerpt: 'Leer hoe je je aanhanger goed onderhoudt om de levensduur te verlengen en problemen te voorkomen.',
      coverImage: faker.image.url(),
      published: true,
      publishedAt: faker.date.recent({ days: 45 }),
      authorName: 'Peter Bakker',
      metaTitle: 'Onderhoudstips voor aanhangers - Houd je aanhanger in topconditie',
      metaDescription: 'Praktische tips voor het onderhouden van je aanhanger, van banden tot verlichting en meer.'
    }
  ];
  
  for (const post of blogPosts) {
    // Kies 1-3 willekeurige categorieën voor elk bericht
    const categories = randomItems(blogCategories, 1, 3);
    
    await prisma.blog.create({
      data: {
        ...post,
        categories: {
          connect: categories.map(category => ({ id: category.id }))
        }
      }
    });
  }
}

async function createSupportTickets(users) {
    const ticketData = [];
    
    // Categorieën voor supporttickets
    const categories = ['ACCOUNT', 'PAYMENT', 'RENTAL', 'TECHNICAL', 'DAMAGE', 'COMPLAINT'];
    
    // Status opties
    const statusOptions = ['OPEN', 'IN_PROGRESS', 'CLOSED', 'REOPENED'];
    
    // Prioriteitsopties
    const priorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    
    // Maak tickets voor willekeurige gebruikers
    for (let i = 0; i < 30; i++) {
      const user = randomItem(users);
      const category = randomItem(categories);
      const status = randomItem(statusOptions);
      const priority = randomItem(priorityOptions);
      const createdAt = faker.date.recent({ days: 60 });
      
      let closedAt = null;
      if (status === 'CLOSED') {
        closedAt = new Date(createdAt.getTime() + faker.number.int({ min: 1, max: 10 }) * 24 * 60 * 60 * 1000);
      }
      
      ticketData.push({
        subject: faker.helpers.arrayElement([
          'Probleem met betaling',
          'Vraag over beschikbaarheid',
          'Annulering lukt niet',
          'Aanhanger niet zoals beschreven',
          'Verzoek om verlenging',
          'Problemen met app/website',
          'Schade melden',
          'Account verificatie',
          'Vragen over verzekering',
          'Probleem met verhuurder'
        ]),
        description: faker.lorem.paragraphs(2),
        status,
        priority,
        category,
        attachments: faker.datatype.boolean(0.3) ? [faker.image.url()] : [],
        createdAt,
        updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
        closedAt,
        userId: user.id
      });
    }
    
    await prisma.supportTicket.createMany({
      data: ticketData,
      skipDuplicates: true,
    });
    
    // Maak ook reacties voor de tickets
    const tickets = await prisma.supportTicket.findMany();
    
    for (const ticket of tickets) {
      // 1-5 reacties per ticket (afhankelijk van status)
      const replyCount = ticket.status === 'CLOSED' 
        ? faker.number.int({ min: 2, max: 5 })
        : ticket.status === 'IN_PROGRESS'
          ? faker.number.int({ min: 1, max: 3 })
          : faker.number.int({ min: 0, max: 2 });
      
      for (let i = 0; i < replyCount; i++) {
        const isStaffReply = i === 0 ? false : faker.datatype.boolean(0.7);
        const replyUser = isStaffReply 
          ? await prisma.user.findFirst({ where: { role: 'ADMIN' } })
          : await prisma.user.findUnique({ where: { id: ticket.userId } });
        
        if (!replyUser) continue;
        
        await prisma.supportReply.create({
          data: {
            message: faker.lorem.paragraphs(1),
            isStaffReply,
            attachments: faker.datatype.boolean(0.2) ? [faker.image.url()] : [],
            ticketId: ticket.id,
            userId: replyUser.id
          }
        });
      }
    }
  }
  
  async function createUserStats(users) {
    const statsData = [];
    
    for (const user of users) {
      // Bereken statistieken op basis van rol
      const isLessor = user.role === 'LESSOR' || user.role === 'ADMIN';
      
      // Rentals tellen
      const rentals = await prisma.rental.count({
        where: {
          OR: [
            { renterId: user.id },
            { lessorId: user.id }
          ]
        }
      });
      
      // Voltooide rentals tellen
      const completedRentals = await prisma.rental.count({
        where: {
          OR: [
            { renterId: user.id },
            { lessorId: user.id }
          ],
          status: RentalStatus.COMPLETED
        }
      });
      
      // Geannuleerde rentals tellen
      const cancelledRentals = await prisma.rental.count({
        where: {
          OR: [
            { renterId: user.id },
            { lessorId: user.id }
          ],
          status: RentalStatus.CANCELLED
        }
      });
      
      // Gemiddelde rating berekenen
      let avgRating = null;
      
      if (isLessor) {
        const reviews = await prisma.review.findMany({
          where: { reviewedUserId: user.id }
        });
        
        if (reviews.length > 0) {
          avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        }
      }
      
      // Inkomsten en uitgaven berekenen
      let totalIncome = 0;
      let totalSpent = 0;
      
      if (isLessor) {
        // Inkomsten voor verhuurders
        const lessorRentals = await prisma.rental.findMany({
          where: {
            lessorId: user.id,
            status: RentalStatus.COMPLETED
          },
          select: {
            totalPrice: true,
            serviceFee: true
          }
        });
        
        totalIncome = lessorRentals.reduce((sum, rental) => {
          // Verhuurder krijgt totaalprijs min servicekosten
          return sum + rental.totalPrice - (rental.serviceFee || 0);
        }, 0);
      }
      
      // Uitgaven voor alle gebruikers (als huurder)
      const renterRentals = await prisma.rental.findMany({
        where: {
          renterId: user.id,
          status: RentalStatus.COMPLETED
        },
        select: {
          totalPrice: true
        }
      });
      
      totalSpent = renterRentals.reduce((sum, rental) => sum + rental.totalPrice, 0);
      
      // Stats aanmaken
      statsData.push({
        totalRentals: rentals,
        totalIncome,
        totalSpent,
        cancelledRentals,
        completedRentals,
        averageRating: avgRating,
        responseRate: faker.number.float({ min: 70, max: 100, fractionDigits: 2 }),
        responseTime: faker.number.int({ min: 5, max: 120 }),
        acceptanceRate: faker.number.float({ min: 60, max: 100, fractionDigits: 2 }),
        userId: user.id
      });
    }
    
    await prisma.userStats.createMany({
      data: statsData,
      skipDuplicates: true,
    });
  }
  
  async function createNotifications(users) {
    const notificationData = [];
    
    for (const user of users) {
      // 0-10 notificaties per gebruiker
      const count = faker.number.int({ min: 0, max: 10 });
      
      for (let i = 0; i < count; i++) {
        const notificationType = randomItem(Object.values(NotificationType));
        const createdAt = faker.date.recent({ days: 14 });
        
        let message;
        let actionUrl = null;
        
        switch (notificationType) {
          case NotificationType.BOOKING:
            message = faker.helpers.arrayElement([
              'Je hebt een nieuwe boekingsaanvraag ontvangen',
              'Je boeking is bevestigd',
              'Herinnering: je hebt morgen een aanhanger gereserveerd',
              'Je boeking start over 2 uur'
            ]);
            actionUrl = '/bookings';
            break;
          case NotificationType.PAYMENT:
            message = faker.helpers.arrayElement([
              'Je betaling is ontvangen',
              'Je uitbetaling staat klaar',
              'Betaling mislukt, probeer het opnieuw',
              'Factuur beschikbaar voor recente boeking'
            ]);
            actionUrl = '/payments';
            break;
          case NotificationType.CHAT:
            message = faker.helpers.arrayElement([
              'Je hebt een nieuw bericht ontvangen',
              'Onbeantwoord bericht van een huurder',
              'Bekijk je chatgeschiedenis'
            ]);
            actionUrl = '/messages';
            break;
          case NotificationType.SYSTEM:
            message = faker.helpers.arrayElement([
              'Je account is succesvol geverifieerd',
              'Belangrijk: wijzigingen in de gebruiksvoorwaarden',
              'Onderhoud gepland voor vanavond',
              'Je wachtwoord is gewijzigd'
            ]);
            break;
          case NotificationType.REMINDER:
            message = faker.helpers.arrayElement([
              'Vergeet niet je aanhanger morgen op te halen',
              'Herinnering: breng de aanhanger terug binnen 24 uur',
              'Je hebt nog geen beoordeling achtergelaten',
              'Vergeet niet je beschikbaarheid bij te werken'
            ]);
            break;
          case NotificationType.PROMOTION:
            message = faker.helpers.arrayElement([
              'Speciale aanbieding: 10% korting op je volgende huur',
              'Nieuwe aanhangers beschikbaar in jouw buurt',
              'Verwijs een vriend en ontvang €10 korting',
              'Zomerpromotie: langere huurperiodes met korting'
            ]);
            actionUrl = '/promotions';
            break;
          default:
            message = faker.helpers.arrayElement([
              'Bedankt voor het gebruiken van ons platform',
              'Bekijk onze nieuwe functies',
              'Hoe bevalt het platform tot nu toe?'
            ]);
        }
        
        notificationData.push({
          message,
          read: faker.datatype.boolean(0.4),
          type: notificationType,
          actionUrl,
          expiresAt: faker.datatype.boolean(0.7) 
            ? new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000) 
            : null,
          createdAt,
          userId: user.id
        });
      }
    }
    
    await prisma.notification.createMany({
      data: notificationData,
      skipDuplicates: true,
    });
  }
  
  async function createDocuments(users) {
    const documentData = [];
    
    for (const user of users) {
      // Alleen geverifieerde gebruikers hebben documenten
      if (!user.isVerified) continue;
      
      // ID document (bijna iedereen heeft dit)
      if (faker.datatype.boolean(0.95)) {
        documentData.push({
          url: faker.image.url(),
          type: DocumentType.ID,
          name: 'ID kaart',
          description: faker.datatype.boolean(0.5) ? 'Identiteitskaart/paspoort' : null,
          verified: faker.datatype.boolean(0.9),
          verifiedAt: faker.date.past(),
          expiryDate: faker.date.future(),
          userId: user.id
        });
      }
      
      // Rijbewijs (bijna iedereen heeft dit)
      if (faker.datatype.boolean(0.9)) {
        documentData.push({
          url: faker.image.url(),
          type: DocumentType.LICENSE,
          name: 'Rijbewijs',
          description: faker.datatype.boolean(0.3) ? 'Rijbewijs B/BE' : null,
          verified: faker.datatype.boolean(0.95),
          verifiedAt: faker.date.past(),
          expiryDate: faker.date.future(),
          userId: user.id
        });
      }
      
      // Verzekeringsdocument (sommigen hebben dit)
      if (faker.datatype.boolean(0.4)) {
        documentData.push({
          url: faker.image.url(),
          type: DocumentType.INSURANCE,
          name: 'Verzekeringsbewijs',
          description: faker.datatype.boolean(0.5) ? 'WA-verzekering' : null,
          verified: faker.datatype.boolean(0.8),
          verifiedAt: faker.date.past(),
          expiryDate: faker.date.future(),
          userId: user.id
        });
      }
      
      // Overige documenten (weinigen hebben dit)
      if (faker.datatype.boolean(0.2)) {
        documentData.push({
          url: faker.image.url(),
          type: DocumentType.OTHER,
          name: faker.helpers.arrayElement(['Uittreksel KvK', 'Aankoopbewijs aanhanger', 'Kentekenbewijs']),
          description: faker.datatype.boolean(0.5) ? faker.lorem.sentence() : null,
          verified: faker.datatype.boolean(0.7),
          verifiedAt: faker.date.past(),
          expiryDate: faker.date.future(),
          userId: user.id
        });
      }
    }
    
    await prisma.document.createMany({
      data: documentData,
      skipDuplicates: true,
    });
  }
  
  async function createWalletsAndTransactions(users) {
    // Maak wallets aan
    const walletData = [];
    
    for (const user of users) {
      // Niet alle gebruikers hebben een wallet
      if (user.role === 'LESSOR' || user.role === 'ADMIN' || faker.datatype.boolean(0.3)) {
        const balance = faker.number.float({ min: 0, max: 1000, fractionDigits: 2 });
        
        walletData.push({
          balance,
          currency: 'EUR',
          lastPayout: faker.datatype.boolean(0.7) ? faker.date.recent({ days: 30 }) : null,
          userId: user.id
        });
      }
    }
    
    await prisma.wallet.createMany({
      data: walletData,
      skipDuplicates: true,
    });
    
    // Haal alle wallets op
    const wallets = await prisma.wallet.findMany();
    
    // Maak transacties aan
    const transactionData = [];
    
    for (const wallet of wallets) {
      // 5-20 transacties per wallet
      const count = faker.number.int({ min: 5, max: 20 });
      
      for (let i = 0; i < count; i++) {
        const transactionType = faker.helpers.arrayElement(['DEPOSIT', 'WITHDRAWAL', 'EARNING', 'REFUND', 'FEE']);
        let amount;
        
        switch (transactionType) {
          case 'DEPOSIT':
            amount = faker.number.float({ min: 50, max: 500, fractionDigits: 3 });
            break;
          case 'WITHDRAWAL':
            amount = -1 * faker.number.float({ min: 50, max: 500, fractionDigits: 3 });
            break;
          case 'EARNING':
            amount = faker.number.float({ min: 20, max: 200, fractionDigits: 3 });
            break;
          case 'REFUND':
            amount = faker.number.float({ min: 10, max: 100, fractionDigits: 3 });
            break;
          case 'FEE':
            amount = -1 * faker.number.float({ min: 5, max: 20, fractionDigits: 3 });
            break;
        }
        
        transactionData.push({
          amount,
          type: transactionType,
          status: 'COMPLETED',
          description: getTransactionDescription(transactionType),
          externalReference: faker.datatype.boolean(0.7) ? faker.string.alphanumeric(10) : null,
          createdAt: faker.date.recent({ days: 90 }),
          walletId: wallet.id
        });
      }
    }
    
    await prisma.walletTransaction.createMany({
      data: transactionData,
      skipDuplicates: true,
    });
  }
  
  function getTransactionDescription(type) {
    switch (type) {
      case 'DEPOSIT':
        return faker.helpers.arrayElement([
          'Storting op wallet',
          'Opwaardering van account',
          'Wallet opgeladen via iDEAL',
          'Storting voor toekomstige boekingen'
        ]);
      case 'WITHDRAWAL':
        return faker.helpers.arrayElement([
          'Opname naar bankrekening',
          'Uitbetaling van verhuuropbrengsten',
          'Periodieke opname',
          'Uitbetaling gevraagd door gebruiker'
        ]);
      case 'EARNING':
        return faker.helpers.arrayElement([
          'Verdiensten van verhuur #' + faker.string.numeric(5),
          'Verhuuropbrengst voor ' + faker.date.recent({ days: 30 }).toLocaleDateString(),
          'Inkomsten uit verhuur',
          'Uitbetaling van voltooide verhuur'
        ]);
      case 'REFUND':
        return faker.helpers.arrayElement([
          'Terugbetaling voor geannuleerde boeking',
          'Restitutie voor niet-beschikbare aanhanger',
          'Refund voor klacht',
          'Teruggave borg'
        ]);
      case 'FEE':
        return faker.helpers.arrayElement([
          'Platformvergoeding voor verhuur',
          'Servicekosten',
          'Transactiekosten',
          'Verwerkingskosten betaling'
        ]);
      default:
        return 'Wallet transactie';
    }
  }
  
  async function createAnalyticsEvents() {
    const eventTypes = [
      'PAGE_VIEW', 'SEARCH', 'LISTING_VIEW', 'BOOKING_STARTED',
      'BOOKING_COMPLETED', 'BOOKING_CANCELLED', 'USER_SIGNUP',
      'USER_LOGIN', 'CONTACT_FORM', 'FEATURE_USED'
    ];
    
    const pages = [
      '/', '/search', '/trailers', '/trailers/detail', '/account',
      '/bookings', '/messages', '/favorites', '/how-it-works', '/contact'
    ];
    
    const analyticsData = [];
    
    // Genereer 500 analytische events
    for (let i = 0; i < 500; i++) {
      const eventType = randomItem(eventTypes);
      let data = {};
      
      switch (eventType) {
        case 'SEARCH':
          data = {
            query: faker.helpers.arrayElement(['aanhanger', 'open aanhanger', 'autotransporter', 'boottrailer', 'verhuisaanhanger', '']),
            location: faker.location.city(),
            filters: {
              minPrice: faker.helpers.arrayElement([null, 10, 20, 30]),
              maxPrice: faker.helpers.arrayElement([null, 50, 75, 100]),
              type: faker.helpers.arrayElement([null, 'OPEN', 'CLOSED']),
              delivery: faker.datatype.boolean(0.3)
            },
            resultsCount: faker.number.int({ min: 0, max: 30 })
          };
          break;
        case 'LISTING_VIEW':
          data = {
            listingId: faker.string.uuid(),
            duration: faker.number.int({ min: 5, max: 300 })
          };
          break;
        case 'BOOKING_STARTED':
        case 'BOOKING_COMPLETED':
        case 'BOOKING_CANCELLED':
          data = {
            listingId: faker.string.uuid(),
            rentalId: faker.string.uuid(),
            amount: faker.number.float({ min: 20, max: 200, fractionDigits: 3 })
          };
          break;
        case 'USER_SIGNUP':
        case 'USER_LOGIN':
          data = {
            userType: faker.helpers.arrayElement(['NEW', 'RETURNING']),
            source: faker.helpers.arrayElement(['DIRECT', 'GOOGLE', 'FACEBOOK', 'REFERRAL'])
          };
          break;
        case 'FEATURE_USED':
          data = {
            feature: faker.helpers.arrayElement(['FILTER', 'SORT', 'MAP_VIEW', 'SHARE', 'SAVE']),
            duration: faker.number.int({ min: 1, max: 30 })
          };
          break;
      }
      
      analyticsData.push({
        eventType,
        page: eventType === 'PAGE_VIEW' ? randomItem(pages) : null,
        userId: faker.datatype.boolean(0.7) ? faker.string.uuid() : null,
        sessionId: faker.string.alphanumeric(16),
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
        referrer: faker.datatype.boolean(0.4) ? faker.internet.url() : null,
        data,
        createdAt: faker.date.recent({ days: 30 })
      });
    }
    
    await prisma.analyticsEvent.createMany({
      data: analyticsData,
      skipDuplicates: true,
    });
  }
  
  async function createMarketingStats() {
    const marketingData = [];
    
    // Marketing statistieken voor de afgelopen 30 dagen
    const sources = ['FACEBOOK', 'GOOGLE', 'INSTAGRAM', 'DIRECT', 'ORGANIC', 'EMAIL', 'REFERRAL'];
    
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      for (const source of sources) {
        const visitors = faker.number.int({ min: 10, max: 500 });
        const signupRate = faker.number.float({ min: 0.01, max: 0.05, fractionDigits: 4 });
        const signups = Math.floor(visitors * signupRate);
        
        const listingRate = faker.number.float({ min: 0.005, max: 0.02, fractionDigits: 4 });
        const newListings = Math.floor(signups * listingRate);
        
        const bookingRate = faker.number.float({ min: 0.1, max: 0.3, fractionDigits: 3 });
        const bookings = Math.floor(visitors * bookingRate);
        
        const avgBookingValue = faker.number.float({ min: 50, max: 150, fractionDigits: 3 });
        const totalRevenue = bookings * avgBookingValue;
        
        marketingData.push({
          date,
          visitors,
          signups,
          newListings,
          bookings,
          totalRevenue,
          marketingSource: source,
          campaign: faker.datatype.boolean(0.3) ? 'CAMPAIGN_' + faker.string.alphanumeric(5) : null,
        });
      }
    }
    
    await prisma.marketingStat.createMany({
      data: marketingData,
      skipDuplicates: true,
    });
  }
  
  async function createSystemSettings() {
    const settings = [
      { key: 'SITE_NAME', value: 'AanhangerHuren', description: 'Naam van het platform' },
      { key: 'CONTACT_EMAIL', value: 'info@aanhangerhuren.nl', description: 'Primair contact e-mailadres' },
      { key: 'SUPPORT_PHONE', value: '+31 123 456 789', description: 'Klantenservice telefoonnummer' },
      { key: 'MAINTENANCE_MODE', value: 'false', description: 'Of het platform in onderhoudsmodus staat' },
      { key: 'COMMISSION_RATE', value: '10', description: 'Commissiepercentage dat het platform in rekening brengt' },
      { key: 'MIN_BOOKING_HOURS', value: '4', description: 'Minimaal aantal uren voor een boeking' },
      { key: 'MAX_BOOKING_DAYS', value: '90', description: 'Maximaal aantal dagen voor een boeking' },
      { key: 'BOOKING_LEAD_TIME', value: '2', description: 'Minimaal aantal uren vooraf voor een boeking' },
      { key: 'DEFAULT_CURRENCY', value: 'EUR', description: 'Standaard valuta' },
      { key: 'FEATURED_COST', value: '5.99', description: 'Kosten voor een uitgelichte advertentie per dag' },
      { key: 'REQUIRE_APPROVAL', value: 'false', description: 'Of nieuwe advertenties goedkeuring vereisen' },
      { key: 'ENABLE_REVIEWS', value: 'true', description: 'Of reviews ingeschakeld zijn' },
      { key: 'MIN_PASSWORD_LENGTH', value: '8', description: 'Minimale wachtwoordlengte' },
      { key: 'GOOGLE_MAPS_API_KEY', value: 'YOUR_API_KEY', description: 'API-sleutel voor Google Maps' },
      { key: 'SUPPORT_WORKING_HOURS', value: '09:00-17:00', description: 'Werktijden van klantenservice' }
    ];
    
    await prisma.systemSettings.createMany({
      data: settings,
      skipDuplicates: true,
    });
  }
  
  async function createTransactionLogs(users) {
    const logData = [];
    
    // Admin gebruiker voor systeemacties
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    
    // Verschillende soorten logs
    for (let i = 0; i < 200; i++) {
      const logType = randomItem(Object.values(TransactionType));
      let message;
      const user = faker.datatype.boolean(0.7) ? randomItem(users) : null;
      let amount = null;
      let currency = null;
      
      switch (logType) {
        case TransactionType.BOOKING:
          message = `Boeking ${faker.string.alphanumeric(6)} ${faker.helpers.arrayElement(['aangemaakt', 'gewijzigd', 'geannuleerd', 'voltooid'])}`;
          amount = faker.number.float({ min: 20, max: 200, fractionDigits: 3 });
          currency = 'EUR';
          break;
        case TransactionType.PAYMENT:
          message = `Betaling ${faker.string.alphanumeric(10)} ${faker.helpers.arrayElement(['ontvangen', 'mislukt', 'terugbetaald'])}`;
          amount = faker.number.float({ min: 20, max: 200, fractionDigits: 3 });
          currency = 'EUR';
          break;
        case TransactionType.REVIEW:
          message = `Review geplaatst voor ${faker.helpers.arrayElement(['aanhanger', 'gebruiker'])} ${faker.string.alphanumeric(6)}`;
          break;
        case TransactionType.REPORT:
          message = `Rapport ingediend voor ${faker.helpers.arrayElement(['aanhanger', 'gebruiker'])} ${faker.string.alphanumeric(6)}`;
          break;
        case TransactionType.WITHDRAWAL:
          message = `Opname van €${faker.number.float({ min: 20, max: 500, fractionDigits: 3 })} naar bankrekening ****${faker.string.numeric(4)}`;
          amount = faker.number.float({ min: 20, max: 500, fractionDigits: 3 });
          currency = 'EUR';
          break;
        case TransactionType.DEPOSIT:
          message = `Storting van €${faker.number.float({ min: 20, max: 500, fractionDigits: 3 })} via ${faker.helpers.arrayElement(['iDEAL', 'creditcard', 'PayPal'])}`;
          amount = faker.number.float({ min: 20, max: 500, fractionDigits: 3 });
          currency = 'EUR';
          break;
        case TransactionType.FEE:
          message = `Platformvergoeding van €${faker.number.float({ min: 2, max: 20, fractionDigits: 3 })} voor boeking ${faker.string.alphanumeric(6)}`;
          amount = faker.number.float({ min: 2, max: 20, fractionDigits: 3 });
          currency = 'EUR';
          break;
        case TransactionType.REFUND:
          message = `Terugbetaling van €${faker.number.float({ min: 20, max: 200, fractionDigits: 3 })} voor boeking ${faker.string.alphanumeric(6)}`;
          amount = faker.number.float({ min: 20, max: 200, fractionDigits: 3 });
          currency = 'EUR';
          break;
        case TransactionType.DISPUTE:
          message = `Geschil geopend voor boeking ${faker.string.alphanumeric(6)}`;
          break;
        case TransactionType.OTHER:
          message = faker.helpers.arrayElement([
            'Gebruiker geregistreerd',
            'E-mailadres gewijzigd',
            'Wachtwoord reset aangevraagd',
            'Profiel bijgewerkt',
            'Aanhanger toegevoegd',
            'Aanhanger gewijzigd',
            'Beschikbaarheid aangepast'
          ]);
          break;
      }
      
      logData.push({
        type: logType,
        message,
        amount,
        currency,
        referenceId: faker.datatype.boolean(0.7) ? faker.string.uuid() : null,
        ipAddress: faker.internet.ip(),
        createdAt: faker.date.recent({ days: 30 }),
        userId: user?.id || (admin ? admin.id : null)
      });
    }
    
    await prisma.transactionLog.createMany({
      data: logData,
      skipDuplicates: true,
    });
  }
  

seed()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seeding afgerond');
  })
  .catch(async (e) => {
    console.error('Fout tijdens seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });