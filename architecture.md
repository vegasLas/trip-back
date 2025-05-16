# Telegram Mini App Implementation for Tourist Guide Service

## Overview
This document outlines the implementation plan for a Telegram Mini App that allows tourists to choose tours and select guides, or participate in auctions where guides can bid for tourist requests.

## Backend Implementation

### Step 1: Project Setup

1. **Initialize the project**
   - Create a new directory for the project
   - Initialize npm project: `npm init -y`
   - Install core dependencies:
     ```bash
     npm install express typescript ts-node @types/node @types/express prisma cors @types/cors dotenv
     ```
   - Initialize TypeScript: `npx tsc --init`
   - Configure `tsconfig.json` for TypeScript settings

2. **Set up project structure**
   ```
   /src
     /controllers
     /middlewares
     /models
     /routes
     /services
     /utils
     app.ts
     server.ts
   /prisma
     schema.prisma
   .env
   ```

3. **Configure Express server**
   - Create basic Express server setup in `src/app.ts`
   - Implement CORS configuration
   - Set up error handling middleware
   - Configure environment variables with dotenv

### Step 2: Prisma Schema Design

1. **Initialize Prisma**
   ```bash
   npx prisma init
   ```

2. **Define database schema in `prisma/schema.prisma`**

   ```prisma
   // This is your Prisma schema file
   generator client {
     provider = "prisma-client-js"
   }
   
   datasource db {
     provider = "postgresql" // or any other supported database
     url      = env("DATABASE_URL")
   }
   
   // Base user information shared between tourists and guides
   model BaseUser {
     id            Int       @id @default(autoincrement())
     telegramId    String    @unique
     firstName     String
     lastName      String?
     username      String?
     languageCode  String?
     createdAt     DateTime  @default(now())
     updatedAt     DateTime  @updatedAt

     // One-to-one relations with specific roles
     tourist       Tourist?
     guide         Guide?
   }

   // Tourist-specific model
   model Tourist {
     id            Int       @id @default(autoincrement())
     baseUser      BaseUser  @relation(fields: [baseUserId], references: [id])
     baseUserId    Int       @unique
     bookings      Booking[]
     reviews       Review[]
     auctions      Auction[]
     directRequests DirectRequest[]
     createdAt     DateTime  @default(now())
     updatedAt     DateTime  @updatedAt
   }

   // Guide-specific model with profile information
   model Guide {
     id            Int       @id @default(autoincrement())
     baseUser      BaseUser  @relation(fields: [baseUserId], references: [id])
     baseUserId    Int       @unique
     bio           String?
     languages     String[]  // Languages spoken
     specialties   String[]  // Guide specialties
     phoneNumber   String?
     email         String?
     avatarUrl     String?
     rating        Float?    // Average rating
     isActive      Boolean   @default(true)  // Guide's availability status
     selectedPrograms Program[] @relation("GuideSelectedPrograms") // Programs the guide has selected to work on
     programs      Program[] // Programs created by guide
     receivedReviews Review[] @relation("GuideReviews")
     bids          Bid[]
     recommendations ProgramRecommendation[] // Program recommendations made by the guide
     createdAt     DateTime  @default(now())
     updatedAt     DateTime  @updatedAt
   }
   
   // Program model (replacing Tour)
   model Program {
     id            Int            @id @default(autoincrement())
     title         String
     description   String
     guideId       Int
     guide         Guide          @relation(fields: [guideId], references: [id])
     selectedGuides Guide[]       @relation("GuideSelectedPrograms") // Guides who have selected this program
     basePrice     Float          // Base price per person
     durationDays  Int            // Duration in days
     maxGroupSize  Int
     startLocation String
     regions       String[]       // Regions covered in the program
     tags          String[]       // Categories/tags for the program
     images     String[]       // Program images
     isActive      Boolean        @default(true)
     isApproved    Boolean        @default(false)  // Admin approval status
     bookingType   BookingType    @default(BOTH)  // Type of booking allowed
     createdAt     DateTime       @default(now())
     updatedAt     DateTime       @updatedAt
     
     // Relations
     days          ProgramDay[]   // Days of the program
     bookings      Booking[]      // Direct bookings
     reviews       Review[]       
     pricingTiers  PricingTier[]  // Different pricing tiers based on group size
     directRequests DirectRequest[] // Requests for direct booking
     recommendations ProgramRecommendation[] // Guide recommendations
   }

   // ProgramRecommendation model for guide program recommendations
   model ProgramRecommendation {
     id            Int            @id @default(autoincrement())
     programId     Int
     program       Program        @relation(fields: [programId], references: [id])
     guideId       Int
     guide         Guide          @relation(fields: [guideId], references: [id])
     status        ApprovalStatus @default(PENDING)
     comment       String?        // Guide's recommendation comment
     adminComment  String?        // Admin's response comment
     createdAt     DateTime       @default(now())
     updatedAt     DateTime       @updatedAt
   }

   enum ApprovalStatus {
     PENDING
     APPROVED
     REJECTED
   }

   // DirectRequest model for requesting guide availability
   model DirectRequest {
     id            Int            @id @default(autoincrement())
     programId     Int
     program       Program        @relation(fields: [programId], references: [id])
     touristId     Int
     tourist       Tourist        @relation(fields: [touristId], references: [id])
     startDate     DateTime
     numberOfPeople Int
     status        RequestStatus  @default(PENDING)
     guideResponse String?        // Guide's response message
     createdAt     DateTime       @default(now())
     updatedAt     DateTime       @updatedAt
   }

   // PricingTier model for group-based pricing
   model PricingTier {
     id              Int      @id @default(autoincrement())
     programId       Int
     program         Program  @relation(fields: [programId], references: [id])
     minPeople       Int      // Minimum number of people for this tier
     maxPeople       Int      // Maximum number of people for this tier
     pricePerPerson  Float    // Price per person for this group size
     isActive        Boolean  @default(true)
     createdAt       DateTime @default(now())
     updatedAt       DateTime @updatedAt

     // Relations
     bookings        Booking[] // Bookings that used this pricing tier
   }
   
   // ProgramDay model
   model ProgramDay {
     id            Int            @id @default(autoincrement())
     programId     Int
     program       Program        @relation(fields: [programId], references: [id])
     dayNumber     Int            // Day 1, Day 2, etc.
     title         String?
     description   String?
     createdAt     DateTime       @default(now())
     updatedAt     DateTime       @updatedAt
     
     // Relations
     points        ProgramPoint[] // Points/activities in this day
   }
   
   // ProgramPoint model
   model ProgramPoint {
     id            Int            @id @default(autoincrement())
     programDayId  Int
     programDay    ProgramDay     @relation(fields: [programDayId], references: [id])
     title         String
     description   String?
     pointType     PointType      @default(ACTIVITY) // Type of point (meal, activity, etc.)
     order         Int            // Order in the day
     duration      Int?           // Duration in minutes (optional)
     location      String?
     imageUrl      String?
     createdAt     DateTime       @default(now())
     updatedAt     DateTime       @updatedAt
   }
   
   // Booking model
   model Booking {
     id             Int            @id @default(autoincrement())
     programId      Int
     program        Program        @relation(fields: [programId], references: [id])
     touristId      Int
     tourist        Tourist        @relation(fields: [touristId], references: [id])
     startDate      DateTime
     status         BookingStatus  @default(PENDING)
     numberOfPeople Int            @default(1)
     pricingTierId  Int?
     pricingTier    PricingTier?  @relation(fields: [pricingTierId], references: [id])
     pricePerPerson Float          // Price per person that was applied
     totalPrice     Float          // Total price for all people
     createdAt      DateTime       @default(now())
     updatedAt      DateTime       @updatedAt
   }
   
   // Review model
   model Review {
     id            Int            @id @default(autoincrement())
     programId     Int
     program       Program        @relation(fields: [programId], references: [id])
     touristId     Int
     tourist       Tourist        @relation(fields: [touristId], references: [id])
     guideId       Int
     guide         Guide          @relation(name: "GuideReviews", fields: [guideId], references: [id])
     rating        Int            // 1-5 stars
     comment       String?
     createdAt     DateTime       @default(now())
     updatedAt     DateTime       @updatedAt
   }
   
   // Auction model for tourists to request custom tours
   model Auction {
     id            Int            @id @default(autoincrement())
     touristId     Int            // Tourist who created the auction
     tourist       Tourist        @relation(fields: [touristId], references: [id])
     title         String
     description   String
     location      String
     startDate     String         // Desired date range
     numberOfPeople Int
     budget        Float?
     status        AuctionStatus  @default(OPEN)
     expiresAt     DateTime
     createdAt     DateTime       @default(now())
     updatedAt     DateTime       @updatedAt
     
     // Relations
     bids          Bid[]
   }
   
   // Bid model for guides to bid on auctions
   model Bid {
     id            Int            @id @default(autoincrement())
     auctionId     Int
     auction       Auction        @relation(fields: [auctionId], references: [id])
     guideId       Int
     guide         Guide          @relation(fields: [guideId], references: [id])
     price         Float
     description   String
     isAccepted    Boolean        @default(false)
     createdAt     DateTime       @default(now())
     updatedAt     DateTime       @updatedAt
   }
   
   // Enums
   enum BookingStatus {
     PENDING
     CONFIRMED
     CANCELLED
     COMPLETED
   }
   
   enum AuctionStatus {
     OPEN
     CLOSED
     CANCELLED
   }
   
   enum PointType {
     ACTIVITY
     MEAL
     TRANSPORT
     ACCOMMODATION
     SIGHTSEEING
     OTHER
   }

   enum BookingType {
     DIRECT_ONLY    // Only direct booking allowed
     AUCTION_ONLY   // Only auction booking allowed
     BOTH           // Both booking types allowed
   }

   enum RequestStatus {
     PENDING
     ACCEPTED
     REJECTED
     EXPIRED
   }

   // Payment model for transaction tracking
   model Payment {
     id             Int            @id @default(autoincrement())
     guideId        Int
     guide          Guide          @relation(fields: [guideId], references: [id])
     currency       String         @default("RUB")
     status         PaymentStatus  @default(PENDING)
     paymentType    PaymentType
     idempotencyKey    Int?           // ID of related Auction or DirectRequest
     tariff         Tariff? @relation(fields: [tariffId], references: [id])
     tariffId        Int?
     createdAt      DateTime       @default(now())
     updatedAt      DateTime       @updatedAt
   }
   

   model Tariff {
     id             Int      @id @default(autoincrement())
     amount         Int      // Number of tariff units
     pricePerUnit   Float    // Price per unit in RUB
     totalPrice     Float    // amount * pricePerUnit
     isActive       Boolean  @default(true) // Permanent active status
     createdAt      DateTime @default(now())
     updatedAt      DateTime @updatedAt
   }

   enum PaymentStatus {
     PENDING
     COMPLETED
     FAILED
     REFUNDED
   }

   enum TariffType {
     FIXED
     PERCENTAGE
     TIERED
   }

   enum PaymentType {
     AUCTION_BID
     DIRECT_BOOKING
     TARIFF
   }
   ```

3. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```

4. **Create database migrations**
   ```bash
   npx prisma migrate dev --name init
   ```

### Step 3: Authentication with Telegram Mini App

1. **Authentication middleware**
   - Implement middleware to validate Telegram Mini App init data
   - Extract user information from init data
   - Verify data signature using bot token

2. **Authentication utility functions**
   - Create a utility file for handling Telegram init data validation
   - Implement functions to parse and verify the data signature

3. **User registration/login flow**
   - Create endpoint to receive init data from Telegram Mini App
   - Validate the data and extract user information
   - Check if BaseUser exists in database, create if not
   - Create associated Tourist or Guide record if needed

### Step 4: API Routes Implementation

1. **User routes**
   - GET /api/users/me - Get current user profile (tourist or guide)
   - PUT /api/users/me - Update user profile
   - GET /api/users/:id - Get public user profile
   - POST /api/users/register-guide - Register as a guide
   - PUT /api/guides/me/status - Update guide's active status (guide only)
   - PUT /api/guides/me/programs - Update guide's selected programs (guide only)
   - GET /api/guides/me/programs - Get guide's selected programs (guide only)

2. **Program routes**
   - GET /api/programs - List all programs with filtering options
   - GET /api/programs/:id - Get program details with days and points
   - GET /api/programs/:id/guides - Get all guides who selected this program
   - POST /api/programs - Create new program (guide only)
   - PUT /api/programs/:id - Update program (owner guide only)
   - DELETE /api/programs/:id - Delete program (owner guide only)
   - POST /api/programs/:id/request - Request guide availability (tourist only)
   - PUT /api/programs/:id/request/:requestId/respond - Respond to availability request (guide only)
   - POST /api/programs/:id/recommend - Recommend a program (guide only)
   - GET /api/programs/recommendations - List all program recommendations (admin only)
   - PUT /api/programs/recommendations/:id/approve - Approve program recommendation (admin only)
   - PUT /api/programs/recommendations/:id/reject - Reject program recommendation (admin only)

3. **Program Day routes**
   - GET /api/programs/:programId/days - List all days for a program
   - GET /api/programs/:programId/days/:dayId - Get day details with points
   - POST /api/programs/:programId/days - Add new day to program (guide only)
   - PUT /api/programs/:programId/days/:dayId - Update day (owner guide only)
   - DELETE /api/programs/:programId/days/:dayId - Delete day (owner guide only)

4. **Program Point routes**
   - GET /api/programs/:programId/days/:dayId/points - List all points for a day
   - POST /api/programs/:programId/days/:dayId/points - Add new point to day (guide only)
   - PUT /api/programs/:programId/days/:dayId/points/:pointId - Update point (owner guide only)
   - DELETE /api/programs/:programId/days/:dayId/points/:pointId - Delete point (owner guide only)

5. **Booking routes**
   - GET /api/bookings - List user bookings
   - GET /api/bookings/:id - Get booking details
   - POST /api/bookings - Create new booking (tourist only)
   - PUT /api/bookings/:id - Update booking status
   - DELETE /api/bookings/:id - Cancel booking

6. **Review routes**
   - GET /api/reviews/program/:programId - Get reviews for a program
   - GET /api/reviews/guide/:guideId - Get reviews for a guide
   - POST /api/reviews - Create new review (tourist only)
   - PUT /api/reviews/:id - Update review (owner tourist only)
   - DELETE /api/reviews/:id - Delete review (owner tourist only)

7. **Auction routes**
   - GET /api/auctions - List all auctions
   - GET /api/auctions/:id - Get auction details
   - POST /api/auctions - Create new auction (tourist only)
   - PUT /api/auctions/:id - Update auction (owner tourist only)
   - DELETE /api/auctions/:id - Cancel auction (owner tourist only)
   - GET /api/auctions/:auctionId/bids - Get all bids for an auction

8. **Bid routes**
   - GET /api/bids/auction/:auctionId - Get bids for an auction
   - POST /api/bids - Create new bid (guide only)
   - PUT /api/bids/:id - Update bid (owner guide only)
   - DELETE /api/bids/:id - Delete bid (owner guide only)
   - POST /api/bids/:id/accept - Accept bid (auction owner only)

9. **Payment & Tariff routes**
   - POST /api/payments - Create payment record (guide only)
   - GET /api/payments - List payments (admin/guide only)
   - GET /api/payments/:id - Get payment details
   - PUT /api/payments/:id/status - Update payment status (admin only)
   - POST /api/payments/webhook - Handle payment provider webhooks
   
   - POST /api/tariffs - Create new tariff package (admin only)
   - PUT /api/tariffs/:id - Update tariff status (admin only)
   - GET /api/tariffs - List available tariffs
   - GET /api/tariffs/active - List currently active tariffs

### Step 5: Controllers and Services Implementation

1. **Create controller files**
   - Implement controller logic for each route
   - Handle request validation and error responses
   - Call appropriate service functions
   - Implement role-based access control

2. **Create service files**
   - Implement business logic for each feature
   - Handle database operations using Prisma client
   - Implement complex operations and validations
   - Add role-specific business logic

3. **Error handling**
   - Create custom error classes
   - Implement global error handling middleware
   - Standardize error responses

### Step 6: Testing and Deployment

1. **Set up testing environment**
   - Configure Jest or another testing framework
   - Create test database configuration
   - Write unit and integration tests
   - Test role-based access control

2. **Deployment preparation**
   - Set up environment variables for production
   - Configure database connection for production
   - Set up logging and monitoring

3. **Deploy backend**
   - Deploy to a cloud provider (AWS, Google Cloud, Heroku, etc.)
   - Set up CI/CD pipeline
   - Configure domain and SSL certificate

### Step 7: Telegram Bot Implementation

1. Initialize Bot project
   - Install `node-telegram-bot-api` and create `src/bot.ts`.
   - Load environment variables (BOT_TOKEN, webhook URL) via dotenv.

2. Create Bot instance
   - Initialize `TelegramBot` with polling or webhook mode:
     const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
   - Set up global error handling for connection issues.

3. Session and Authentication
   - Map Telegram `chat.id` to backend user sessions.
   - On `/start`, prompt user to authenticate via the Mini App or send session token.
   - On `/start`, use Prisma client to check by `telegramId`; if the user does not exist, create a new BaseUser (and Tourist or Guide record) in the database.
   - Store and reuse session tokens for API calls.

4. Command handlers
   - The bot catches all commands via `bot.onText(/\/start/, handler)` or `bot.on('message', handler)`.
   - Все взаимодействия (команды, сообщения, текст кнопок) должны быть на русском.
   - `/start`: отправляет приветственное сообщение с меню в виде inline keyboard WebApp кнопок для основных разделов:
     ```javascript
     const keyboard = [
       [
         { text: '🗂 Программы', web_app: { url: `${URL}?view=programs-main` } },
         { text: '📚 Бронирования', web_app: { url: `${URL}?view=bookings-main` } },
         { text: '🔨 Аукционы', web_app: { url: `${URL}?view=auctions-main` } }
       ]
     ];
     bot.sendMessage(chatId, 'Добро пожаловать! Выберите действие:', { reply_markup: { inline_keyboard: keyboard } });
     ```

5. Callback query handling
   - Use `bot.on('callback_query', ...)` to handle inline button interactions.
   - Parse callback data (e.g., `program_<id>`, `book_<id>`), call corresponding API routes.

6. API Integration
   - Use `axios` or `node-fetch` to call backend endpoints, including session tokens in headers.
   - Handle API responses, errors, and timeouts gracefully.
   - Format and send messages based on JSON data (e.g., program details, booking confirmations).

7. Multi-step flows
   - Implement conversation state tracking for flows requiring multiple inputs (e.g., booking date and group size).
   - Store temporary state in memory or Redis, clear state on completion or timeout.

8. Notifications
   - Subscribe to backend events via webhooks or message queue (e.g., booking confirmations, bid acceptances).
   - Push real-time messages to users using `bot.sendMessage(chatId, ...)`.

9. Deployment
   - Configure webhook URL in Telegram Bot settings if using webhooks.
   - Deploy bot as a separate Node service, ensure restart on failure and high availability.

## Next Steps

After completing the backend implementation, the next phase would involve:

1. **Frontend Development**
   - Create a responsive UI for the Telegram Mini App
   - Implement separate flows for tourists and guides
   - Connect to backend API endpoints
   - Add role-specific features and views

2. **Integration with Telegram Bot**
   - Set up Telegram bot for notifications
   - Configure webhook handlers
   - Implement bot commands for common actions
   - Add role-specific bot commands

3. **Payment Integration**
   - Implement payment processing for bookings
   - Set up secure payment flow
   - Handle payment notifications and confirmations