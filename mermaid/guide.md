## Guide Screens

```mermaid
flowchart LR
  %% Top-level tabs
  ToursTab["Tours Tab"]
  AuctionsTab["Auctions Tab"]
  BookingsTab["Bookings Tab"]
  PaymentsTab["Payments Tab"]
  ProfileTab["Profile Tab"]

  %% Tours management
  ToursTab --> MyTours["My Tours"]
  MyTours --> CreateTour["Create Tour"]
  MyTours --> EditTour["Edit Tour"]
  EditTour --> TourDetails["Tour Details"]
  EditTour --> Itinerary["Itinerary Management"]
  Itinerary --> DaysList["Days List"]
  DaysList --> CreateDay["Create Day"]
  DaysList --> EditDeleteDay["Edit/Delete Day"]
  CreateDay --> PointsManage["Points Management"]
  EditDeleteDay --> PointsManage
  Itinerary --> Pricing["Pricing Plans"]
  Pricing --> CreateTariff["Create Tariff"]
  Pricing --> EditDeleteTariff["Edit/Delete Tariff"]

  %% Bookings
  BookingsTab --> BookingsReceived["Bookings Received"]
  BookingsReceived --> BookingDetail["Booking Detail"]

  %% Payments
  PaymentsTab --> PaymentsReceived["Payments Received"]
  PaymentsReceived --> PaymentDetail["Payment Detail"]

  %% Auctions
  AuctionsTab --> AuctionHome["Auction Home (Market/My Bids)"]
  AuctionHome --> Market["Market"]
  Market --> AuctionDetail["Auction Detail"]
  AuctionDetail --> PlaceBid["Place Bid"]
  AuctionHome --> MyBids["My Bids"]
  MyBids --> BidDetail["Bid Detail"]
  BidDetail --> EditWithdrawBid["Edit/Withdraw Bid"]

  %% Profile
  ProfileTab --> ProfileViewEdit["Profile View/Edit"]
```

## Guide API Flows

### 1. Guide Profile & Setup
```mermaid
sequenceDiagram
    participant Guide
    participant API as Server
    participant DB
    alt Authenticate via Telegram
        Guide->>API: POST /telegram/auth
        API-->>Guide: 200 OK (JWT Token)
    end
    Guide->>API: GET /users/me
    API->>DB: SELECT BaseUser WHERE id = guideId
    DB-->>API: UserProfile
    API-->>Guide: 200 OK UserProfile
    Guide->>API: POST /users/register-guide { bio }
    API->>DB: Update BaseUser role to GUIDE and insert Guide record
    DB-->>API: GuideProfile
    API-->>Guide: 201 Created GuideProfile
    Guide->>API: PUT /guides/me/status { isActive }
    API->>DB: UPDATE Guide SET isActive = ... WHERE baseUserId = guideId
    DB-->>API: success
    API-->>Guide: 200 OK StatusUpdated
    Guide->>API: PUT /guides/me/programs [ programIds ]
    API->>DB: UPDATE GuideSelectedPrograms for guideId
    DB-->>API: success
    API-->>Guide: 200 OK ProgramsUpdated
```

### 2. Programs Management
```mermaid
sequenceDiagram
    participant Guide
    participant API as Server
    participant DB
    Guide->>API: POST /programs { title, description, basePrice, durationDays, ... }
    API->>DB: INSERT INTO Program
    DB-->>API: ProgramRecord
    API-->>Guide: 201 Created Program
    Guide->>API: PUT /programs/{programId} { updates }
    API->>DB: UPDATE Program SET ... WHERE id = programId AND guideId = guideId
    DB-->>API: success
    API-->>Guide: 200 OK UpdatedProgram
    Guide->>API: DELETE /programs/{programId}
    API->>DB: DELETE FROM Program WHERE id = programId AND guideId = guideId
    DB-->>API: success
    API-->>Guide: 200 OK DeletedProgram
```

### 3. Program Days & Points
```mermaid
sequenceDiagram
    participant Guide
    participant API as Server
    participant DB
    Guide->>API: POST /programs/{programId}/days { dayNumber, title, description }
    API->>DB: INSERT INTO ProgramDay
    DB-->>API: ProgramDayRecord
    API-->>Guide: 201 Created ProgramDay
    Guide->>API: PUT /programs/{programId}/days/{dayId} { updates }
    API->>DB: UPDATE ProgramDay SET ... WHERE id = dayId
    DB-->>API: success
    API-->>Guide: 200 OK UpdatedProgramDay
    Guide->>API: DELETE /programs/{programId}/days/{dayId}
    API->>DB: DELETE FROM ProgramDay WHERE id = dayId
    DB-->>API: success
    API-->>Guide: 200 OK DeletedProgramDay

    Guide->>API: POST /programs/{programId}/days/{dayId}/points { title, description, order }
    API->>DB: INSERT INTO ProgramPoint
    DB-->>API: ProgramPointRecord
    API-->>Guide: 201 Created ProgramPoint
    Guide->>API: PUT /programs/{programId}/days/{dayId}/points/{pointId} { updates }
    API->>DB: UPDATE ProgramPoint SET ... WHERE id = pointId
    DB-->>API: success
    API-->>Guide: 200 OK UpdatedProgramPoint
    Guide->>API: DELETE /programs/{programId}/days/{dayId}/points/{pointId}
    API->>DB: DELETE FROM ProgramPoint WHERE id = pointId
    DB-->>API: success
    API-->>Guide: 200 OK DeletedProgramPoint
```

### 4. Direct Booking Requests
```mermaid
sequenceDiagram
    participant Guide
    participant API as Server
    participant DB
    Guide->>API: PUT /programs/{programId}/request/{requestId}/respond { status, guideResponse }
    API->>DB: UPDATE DirectRequest SET status = ..., guideResponse = ... WHERE id = requestId
    DB-->>API: DirectRequest
    API-->>Guide: 200 OK RespondedRequest
```

### 5. Program Recommendations
```mermaid
sequenceDiagram
    participant Guide
    participant API as Server
    participant DB
    Guide->>API: POST /programs/{programId}/recommend { comment }
    API->>DB: INSERT INTO ProgramRecommendation
    DB-->>API: RecommendationRecord
    API-->>Guide: 201 Created Recommendation
```

### 6. Auction Management
```mermaid
sequenceDiagram
    participant Guide
    participant API as Server
    participant DB
    Guide->>API: POST /auctions { title, description, location, startDate, numberOfPeople, budget }
    API->>DB: INSERT INTO Auction
    DB-->>API: AuctionRecord
    API-->>Guide: 201 Created Auction
    Guide->>API: PUT /auctions/{auctionId} { updates }
    API->>DB: UPDATE Auction SET ... WHERE id = auctionId AND guideId = guideId
    DB-->>API: success
    API-->>Guide: 200 OK UpdatedAuction
    Guide->>API: POST /auctions/{auctionId}/end
    API->>DB: UPDATE Auction SET status = CLOSED WHERE id = auctionId
    DB-->>API: success
    API-->>Guide: 200 OK AuctionClosed
    Guide->>API: DELETE /auctions/{auctionId}
    API->>DB: DELETE FROM Auction WHERE id = auctionId
    DB-->>API: success
    API-->>Guide: 200 OK DeletedAuction
    Guide->>API: GET /auctions/guide/own
    API->>DB: SELECT * FROM Auction WHERE guideId = guideId
    DB-->>API: [auctions]
    API-->>Guide: 200 OK [auctions]
```

### 7. Bids Management
```mermaid
sequenceDiagram
    participant Guide
    participant API as Server
    participant DB
    Guide->>API: GET /bids/guide/auction/{auctionId}
    API->>DB: SELECT * FROM Bid WHERE auctionId = auctionId
    DB-->>API: [bids]
    API-->>Guide: 200 OK [bids]
    Guide->>API: GET /bids/guide/highest
    API->>DB: SELECT * FROM Bid WHERE auctionId IN (SELECT id FROM Auction WHERE guideId = guideId) ORDER BY price DESC
    DB-->>API: [highestBids]
    API-->>Guide: 200 OK [highestBids]
```

### 8. Tariff Management
```mermaid
sequenceDiagram
    participant Guide
    participant API as Server
    participant DB
    Guide->>API: POST /tariffs/program/{programId} { amount, pricePerUnit }
    API->>DB: INSERT INTO Tariff
    DB-->>API: TariffRecord
    API-->>Guide: 201 Created Tariff
    Guide->>API: PUT /tariffs/{tariffId} { updates }
    API->>DB: UPDATE Tariff SET ... WHERE id = tariffId
    DB-->>API: success
    API-->>Guide: 200 OK UpdatedTariff
    Guide->>API: PATCH /tariffs/{tariffId}/status
    API->>DB: TOGGLE Tariff.isActive WHERE id = tariffId
    DB-->>API: success
    API-->>Guide: 200 OK ToggledTariff
    Guide->>API: DELETE /tariffs/{tariffId}
    API->>DB: DELETE FROM Tariff WHERE id = tariffId
    DB-->>API: success
    API-->>Guide: 200 OK DeletedTariff
```

### 9. Token Payments
```mermaid
sequenceDiagram
    participant Guide
    participant API as Server
    participant DB
    Guide->>API: POST /payments/tokens/purchase { amount }
    API->>PaymentProvider: Create PaymentIntent
    PaymentProvider-->>API: paymentUrl, intentId
    API-->>Guide: 201 Created { paymentUrl }
    Guide->>API: POST /payments/:id/callback { status, idempotencyKey }
    API->>DB: UPDATE Payment SET status = COMPLETED, completedAt = now() WHERE id = paymentId
    API->>DB: INSERT TokenTransaction(PURCHASE)
    DB-->>API: success
    API-->>Guide: 200 OK PurchaseRecorded
    Guide->>API: POST /payments/tokens/use { amount }
    API->>DB: INSERT TokenTransaction(USAGE)
    API->>DB: UPDATE Guide SET tokenBalance = tokenBalance - amount
    DB-->>API: success
    API-->>Guide: 200 OK TokensUsed
    Guide->>API: GET /payments/tokens/balance
    API->>DB: SELECT tokenBalance FROM Guide WHERE baseUserId = guideId
    DB-->>API: balance
    API-->>Guide: 200 OK { balance }
    Guide->>API: GET /payments/tokens/transactions
    API->>DB: SELECT * FROM TokenTransaction WHERE guideId = guideId
    DB-->>API: [transactions]
    API-->>Guide: 200 OK [transactions]
    Guide->>API: GET /payments/history
    API->>DB: SELECT * FROM Payment WHERE guideId = guideId
    DB-->>API: [payments]
    API-->>Guide: 200 OK [payments]
    Guide->>API: GET /payments/{paymentId}
    API->>DB: SELECT * FROM Payment WHERE id = paymentId
    DB-->>API: payment
    API-->>Guide: 200 OK payment
```

### 10. Booking Status Updates
```mermaid
sequenceDiagram
    participant Guide
    participant API as Server
    participant DB
    Guide->>API: PUT /bookings/{bookingId} { status }
    API->>DB: UPDATE Booking SET status = ... WHERE id = bookingId AND guideId = guideId
    DB-->>API: success
    API-->>Guide: 200 OK BookingUpdated
```

### 11. View Reviews
```mermaid
sequenceDiagram
    participant Guide
    participant API as Server
    participant DB
    Guide->>API: GET /reviews/guide/{guideId}
    API->>DB: SELECT * FROM Review WHERE guideId = guideId AND active = true
    DB-->>API: [reviews]
    API-->>Guide: 200 OK [reviews]
```