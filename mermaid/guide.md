```mermaid
flowchart LR
  %% Top-level tabs
  ToursTab["Tours Tab"] 
  AuctionsTab["Auctions Tab"] 
  BookingsTab["Bookings Tab"] 
  ProfileTab["Profile Tab"]

  %% My Tours management
  subgraph "My Tours Management"
    MT["My Tours"] 
    MT --> CT["Create Tour"]
    MT --> TE["Edit Tour"]
    TE --> TDets["Edit Tour Details"]
    TE --> TI["Itinerary Management"]
    TI --> TDList["Days List"]
    TDList --> CDay["Create Day"]
    TDList --> UDay["Update/Delete Day"]
    CDay --> CPt["Points Management"]
    UDay --> UPt["Update/Delete Point"]
    TE --> TP["Pricing Plans"]
    TP --> CTar["Create Tariff"]
    TP --> UTar["Update/Delete Tariff"]
  end

  %% Bookings received
  subgraph "Bookings Received"
    BR["Bookings Received"] --> BDR["Booking Detail"]
  end

  %% Payments received
  subgraph "Payments Received"
    PRc["Payments Received"] --> PDR["Payment Detail"]
  end

  %% Auction flow (guide)
  subgraph "Auction Home (Guide)"
    AH["Auction Home\n(tab: Market / My Bids)"]
    AH --> AM["Market"]
    AM --> ADg["Auction Detail"]
    ADg --> PB["Place Bid"]
    AH --> MBd["My Bids"]
    MBd --> BDg["Bid Detail"]
    BDg --> EB["Edit/Withdraw Bid"]
  end

  %% Profile flow
  subgraph "Profile"
    PFg["Profile View/Edit"]
  end

  %% Tab → entry points
  ToursTab --> MT
  BookingsTab --> BR
  BookingsTab --> PRc
  AuctionsTab --> AH
  ProfileTab --> PFg
  ```