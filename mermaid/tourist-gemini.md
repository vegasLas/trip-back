## Tab 1: User Profile & Actions

```mermaid
graph TD
    subgraph "User Profile & Actions"
        A1["View Own Profile (GET /users/me)"]
        A2["Update Own Profile (PUT /users/me)"]
        A3["View Public User Profile (e.g., Guide's) (GET /users/:id)"]
        A4["Register to Become a Guide (POST /users/register-guide)"]
    end

    TouristUser([Tourist])

    TouristUser --> A1
    TouristUser --> A2
    TouristUser --> A3
    TouristUser --> A4
```

## Tab 2: Program Discovery & Booking

```mermaid
graph TD
    subgraph "Program Discovery & Booking"
        P1["View All Programs (GET /programs/)"]
        P2["View Program Details (GET /programs/:id)"]
        P3["View Program Guides (GET /programs/:id/guides)"]
        P4["Request Direct Booking for Program<br>(POST /programs/:id/request)"]
    end

    TouristUser([Tourist])

    TouristUser --> P1
    TouristUser --> P2
    TouristUser --> P3
    TouristUser --> P4
```

## Tab 3: Managing Own Bookings

```mermaid
graph TD
    subgraph "Managing Own Bookings"
        BK1["List Own Bookings (GET /bookings/)"]
        BK2["View Own Booking Details (GET /bookings/:id)"]
        BK3["Create New Booking<br>(POST /bookings/) - Requires Tourist"]
        BK4["Update Own Booking Status/Details<br>(PUT /bookings/:id)"]
        BK5["Cancel Own Booking<br>(DELETE /bookings/:id) - Requires Tourist"]
    end

    TouristUser([Tourist])

    TouristUser --> BK1
    TouristUser --> BK2
    TouristUser --> BK3
    TouristUser --> BK4
    TouristUser --> BK5
```

## Tab 4: Managing Own Reviews

```mermaid
graph TD
    subgraph "Managing Own Reviews"
        R1["View Reviews for a Program (GET /reviews/program/:programId)"]
        R2["View Reviews for a Guide (GET /reviews/guide/:guideId)"]
        R3["View Specific Review Details (GET /reviews/:id)"]
        R4["Create Own Review<br>(POST /reviews/) - Requires Tourist"]
        R5["Update Own Review<br>(PUT /reviews/:id) - Requires Tourist"]
        R6["Delete Own Review<br>(DELETE /reviews/:id) - Requires Tourist"]
    end

    TouristUser([Tourist])

    TouristUser --> R1
    TouristUser --> R2
    TouristUser --> R3
    TouristUser --> R4
    TouristUser --> R5
    TouristUser --> R6
```

## Tab 5: Auction Creation & Management (Tourist as Auctioneer)

```mermaid
graph TD
    subgraph "Auction Creation & Management (Tourist as Auctioneer)"
        AUC1["View Active Auctions (Public) (GET /auctions/active)"]
        AUC2["View Auction Details (Public) (GET /auctions/:id)"]
        AUC3["Create Own Auction<br>(POST /auctions/) - Requires Tourist"]
        AUC4["Update Own Auction<br>(PUT /auctions/:id) - Requires Tourist"]
        AUC5["Delete Own Auction<br>(DELETE /auctions/:id) - Requires Tourist"]
        AUC6["End Own Auction<br>(POST /auctions/:id/end) - Requires Tourist"]
        AUC7["View Own Created Auctions<br>(GET /auctions/tourist/auctions) - Requires Tourist"]
    end

    TouristUser([Tourist])

    TouristUser --> AUC1
    TouristUser --> AUC2
    TouristUser --> AUC3
    TouristUser --> AUC4
    TouristUser --> AUC5
    TouristUser --> AUC6
    TouristUser --> AUC7
```

## Tab 6: Viewing Bids on Own Auctions

```mermaid
graph TD
    subgraph "Viewing Bids on Own Auctions"
        B1["View All Bids on an Auction (Public View)<br>(GET /bids/auction/:auctionId)"]
        B2["View Bids Received on Own Auctions<br>(GET /bids/tourist) - Requires Tourist"]
        B3["View Highest Bids on Own Auctions<br>(GET /bids/tourist/highest) - Requires Tourist"]
    end

    TouristUser([Tourist])

    TouristUser --> B1
    TouristUser --> B2
    TouristUser --> B3
```

## Tab 7: General Information Viewing

```mermaid
graph TD
    subgraph "General Information Viewing"
        INFO1["View Tariffs for a Program (GET /tariffs/program/:programId)"]
    end

    TouristUser([Tourist])

    TouristUser --> INFO1
``` 