## Tab 1: User Management

```mermaid
graph TD
    subgraph "User Management"
        A1["View Own Profile (GET /users/me)"]
        A2["Update Own Profile (PUT /users/me)"]
        A3["Register as Guide (POST /users/register-guide)"]
        A4["View Public User Profile (GET /users/:id)"]
    end

    GuideUser([Guide])
    UserWhoWantsToBecomeGuide([User])

    GuideUser --> A1
    GuideUser --> A2
    UserWhoWantsToBecomeGuide --> A3
    GuideUser --> A4
```

## Tab 2: Guide Profile & Settings

```mermaid
graph TD
    subgraph "Guide Profile & Settings"
        GP1["Update Guide Status (Active/Inactive)<br>(PUT /users/guides/me/status)"]
        GP2["Manage Associated Programs<br>(GET/PUT /users/guides/me/programs)"]
    end

    GuideUser([Guide])

    GuideUser --> GP1
    GuideUser --> GP2
```

## Tab 3: Program Interactions

```mermaid
graph TD
    subgraph "Program Interactions"
        P1["View All Programs (GET /programs/)"]
        P2["View Program Details (GET /programs/:id)"]
        P3["View Program Guides (GET /programs/:id/guides)"]
        P4["Recommend Program<br>(POST /programs/:id/recommend)"]
        P5["Respond to Direct Booking Request<br>(PUT /programs/:id/request/:requestId/respond)"]
    end

    GuideUser([Guide])

    GuideUser --> P1
    GuideUser --> P2
    GuideUser --> P3
    GuideUser --> P4
    GuideUser --> P5
```

## Tab 4: Auction Participation (Guide as Bidder)

```mermaid
graph TD
    subgraph "Auction Participation (Guide as Bidder)"
        AUC_P1["View Active Auctions (GET /auctions/active)"]
        AUC_P2["View Auction Details (GET /auctions/:id)"]
        AUC_P3["Place Bid on Auction<br>(POST /auctions/:id/bids)"]
        AUC_P4["View Auctions Bidded On<br>(GET /auctions/guide/bidded)"]
    end

    GuideUser([Guide])

    GuideUser --> AUC_P1
    GuideUser --> AUC_P2
    GuideUser --> AUC_P3
    GuideUser --> AUC_P4
```

## Tab 5: Bid Management (Guide's Own Bids)

```mermaid
graph TD
    subgraph "Bid Management (Guide's Own Bids)"
        B1["View Bids for Any Auction (GET /bids/auction/:auctionId)"]
        B2["Create Bid<br>(POST /bids/) - Requires Guide Role"]
        B3["Cancel Own Bid<br>(DELETE /bids/:id) - Requires Guide Role"]
        B4["View Bids on Specific Auction (Guide's view on an auction)<br>(GET /bids/guide/auction/:auctionId)"]
    end
    Note["Note: Guides now act as bidders and manage their own bids."]

    GuideUser([Guide])

    GuideUser --> B1
    GuideUser --> B2
    GuideUser --> B3
    GuideUser --> B4
```

## Tab 6: Booking Management (for Guide's Services)

```mermaid
graph TD
    subgraph "Booking Management (for Guide's Services)"
        BK1["View Bookings (for own services)<br>(GET /bookings/)"]
        BK2["View Booking Details (GET /bookings/:id)"]
        BK3["Update Booking Status (Confirm/Decline)<br>(PUT /bookings/:id)"]
    end

    GuideUser([Guide])

    GuideUser --> BK1
    GuideUser --> BK2
    GuideUser --> BK3
```

## Tab 7: Payment & Token Management

```mermaid
graph TD
    subgraph "Payment & Token Management"
        PAY1["Initiate Token Purchase<br>(POST /payments/tokens/purchase)"]
        PAY2["Use Tokens<br>(POST /payments/tokens/use)"]
        PAY3["View Token Balance<br>(GET /payments/tokens/balance)"]
        PAY4["View Token Transactions<br>(GET /payments/tokens/transactions)"]
        PAY5["View Payments Received History<br>(GET /payments/history)"]
        PAY6["View Payment Details<br>(GET /payments/:id)"]
    end

    GuideUser([Guide])

    GuideUser --> PAY1
    GuideUser --> PAY2
    GuideUser --> PAY3
    GuideUser --> PAY4
    GuideUser --> PAY5
    GuideUser --> PAY6
```

## Tab 8: Information Viewing

```mermaid
graph TD
    subgraph "Information Viewing"
        INFO1["View Program Reviews (GET /reviews/program/:programId)"]
        INFO2["View Guide Reviews (GET /reviews/guide/:guideId)"]
        INFO3["View Tariffs for Program (GET /tariffs/program/:programId)"]
    end

    GuideUser([Guide])

    GuideUser --> INFO1
    GuideUser --> INFO2
    GuideUser --> INFO3
```