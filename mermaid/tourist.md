```mermaid

flowchart LR
  %% Top-level tabs
  ToursTab["Tours Tab"] 
  AuctionsTab["Auctions Tab"] 
  BookingsTab["Bookings Tab"] 
  ProfileTab["Profile Tab"]

  %% Tours flow
  subgraph "Tour Flow"
    TL["Tour Listing"] --> TD["Tour Details"]
    TD --> IT["Itinerary"]
    IT --> DD["Day Detail"]
    DD --> PD["Point Detail"]
    TD --> PR["Pricing & Booking"]
    PR --> CB["Confirm Booking"]
    CB --> PY["Payment"]
    PY --> PS["Payment Status"]
    TD --> RS["Reviews"]
  end

  %% Auction flow (tourist)
  subgraph "Auction Flow (Tourist)"
    AR["Post Auction Request"] --> MA["My Auctions"]
    MA --> AD["Auction Detail"]
    AD --> BI["Incoming Bids"]
    BI --> AB["Accept Bid"]
  end

  %% Bookings flow
  subgraph "Bookings Flow"
    MB["My Bookings"] --> BD["Booking Detail"]
    BD --> CB2["Cancel Booking"]
  end

  %% Profile flow
  subgraph "Profile"
    PF["Profile View/Edit"] --> AG["Apply as Guide"]
  end

  %% Tab → entry points
  ToursTab --> TL
  AuctionsTab --> AR
  BookingsTab --> MB
  ProfileTab --> PF
  ```