## Tourist Screens

```mermaid
flowchart LR
  %% Top-level tabs
  ProgramsTab["Programs Tab"]
  AuctionsTab["Auctions Tab"]
  BookingsTab["Bookings Tab"]
  ReviewsTab["Reviews Tab"]
  ProfileTab["Profile Tab"]

  %% Program Browse & Details
  ProgramsTab --> Search["Search Programs"]
  Search --> ProgramList["Program List"]
  ProgramList --> ProgramDetail["Program Detail"]
  ProgramDetail --> GuidesList["View Guides"]
  ProgramDetail --> DirectBooking["Direct Booking Request"]

  %% Auctions
  AuctionsTab --> ActiveAuctions["Active Auctions"]
  ActiveAuctions --> AuctionDetail["Auction Detail"]
  AuctionDetail --> PlaceBid["Place Bid"]
  AuctionsTab --> MyBids["My Bids"]
  MyBids --> BidDetail["Bid Detail"]
  BidDetail --> EditBid["Withdraw/Edit Bid"]

  %% Bookings
  BookingsTab --> MyBookings["My Bookings"]
  MyBookings --> BookingDetail["Booking Detail"]
  BookingDetail --> CancelBooking["Cancel Booking"]

  %% Reviews
  ReviewsTab --> ProgramReviews["Program Reviews"]
  ReviewsTab --> GuideReviews["Guide Reviews"]
  ReviewsTab --> AddReview["Add Review"]

  %% Profile
  ProfileTab --> ViewEditProfile["View/Edit Profile"]
```

## Tourist API Flows

### 1. User Profile & Authentication
```mermaid
sequenceDiagram
    participant Tourist
    participant API as Server
    participant DB
    alt Authenticate via Telegram
        Tourist->>API: POST /telegram/auth
        API-->>Tourist: 200 OK (JWT Token)
    end
    Tourist->>API: GET /users/me
    API->>DB: SELECT BaseUser WHERE id = touristId
    DB-->>API: UserProfile
    API-->>Tourist: 200 OK UserProfile
    Tourist->>API: PUT /users/me { updates }
    API->>DB: UPDATE BaseUser SET ... WHERE id = touristId
    DB-->>API: success
    API-->>Tourist: 200 OK UpdatedProfile
```

### 2. Search Programs
```mermaid
sequenceDiagram
    participant Tourist
    participant API as Server
    participant DB
    Tourist->>API: GET /programs
    API->>DB: SELECT * FROM Program WHERE isActive = true AND isApproved = true
    DB-->>API: [programs]
    API-->>Tourist: 200 OK [programs]
```

### 3. View Program Details & Guides
```mermaid
sequenceDiagram
    participant Tourist
    participant API as Server
    participant DB
    Tourist->>API: GET /programs/{programId}
    API->>DB: SELECT * FROM Program WHERE id = programId
    DB-->>API: program
    API-->>Tourist: 200 OK program
    Tourist->>API: GET /programs/{programId}/guides
    API->>DB: SELECT Guide WHERE programId IN selectedPrograms OR guideId matches
    DB-->>API: [guides]
    API-->>Tourist: 200 OK [guides]
```

### 4. Direct Booking Request
```mermaid
sequenceDiagram
    participant Tourist
    participant API as Server
    participant DB
    Tourist->>API: POST /programs/{programId}/request { startDate, numberOfPeople }
    API->>DB: INSERT INTO DirectRequest
    DB-->>API: DirectRequestRecord
    API-->>Tourist: 201 Created RequestDetails
```

### 5. Manage Bookings
```mermaid
sequenceDiagram
    participant Tourist
    participant API as Server
    participant DB
    Tourist->>API: GET /bookings
    API->>DB: SELECT * FROM Booking WHERE touristId = currentUser
    DB-->>API: [bookings]
    API-->>Tourist: 200 OK [bookings]
    Tourist->>API: POST /bookings { programId, startDate, numberOfPeople, pricingTierId }
    API->>DB: INSERT INTO Booking
    DB-->>API: BookingRecord
    API-->>Tourist: 201 Created Booking
    Tourist->>API: DELETE /bookings/{bookingId}
    API->>DB: UPDATE Booking SET status = CANCELLED
    DB-->>API: success
    API-->>Tourist: 200 OK Cancelled
```

### 6. View Tariffs
```mermaid
sequenceDiagram
    participant Tourist
    participant API as Server
    participant DB
    Tourist->>API: GET /tariffs/program/{programId}
    API->>DB: SELECT * FROM Tariff WHERE programId = programId AND isActive = true
    DB-->>API: [tariffs]
    API-->>Tourist: 200 OK [tariffs]
```

### 7. Auction & Bidding
```mermaid
sequenceDiagram
    participant Tourist
    participant API as Server
    participant DB
    Tourist->>API: GET /auctions/active
    API->>DB: SELECT * FROM Auction WHERE status = OPEN
    DB-->>API: [auctions]
    API-->>Tourist: 200 OK [auctions]
    Tourist->>API: GET /auctions/{auctionId}
    API->>DB: SELECT * FROM Auction WHERE id = auctionId
    DB-->>API: auction
    API-->>Tourist: 200 OK auction
    Tourist->>API: POST /auctions/{auctionId}/bids { price, description }
    API->>DB: INSERT INTO Bid
    DB-->>API: BidRecord
    API-->>Tourist: 201 Created Bid
    Tourist->>API: GET /bids/tourist
    API->>DB: SELECT * FROM Bid WHERE guideId = null? Actually touristId
    DB-->>API: [bids]
    API-->>Tourist: 200 OK [bids]
```

### 8. Reviews
```mermaid
sequenceDiagram
    participant Tourist
    participant API as Server
    participant DB
    Tourist->>API: GET /reviews/program/{programId}
    API->>DB: SELECT * FROM Review WHERE programId = programId AND active = true
    DB-->>API: [reviews]
    API-->>Tourist: 200 OK [reviews]
    Tourist->>API: POST /reviews { programId, guideId, rating, comment }
    API->>DB: INSERT INTO Review
    DB-->>API: ReviewRecord
    API-->>Tourist: 201 Created Review
  ```