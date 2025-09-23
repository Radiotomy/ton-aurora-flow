# AudioTon Production API Reference

## 🚀 Production-Ready APIs

All APIs are live on TON mainnet with production-grade reliability and security.

## TON Blockchain Integration

### Wallet Connection
```typescript
// Connect TON wallet
const connectWallet = async () => {
  const wallet = await tonConnectUI.connectWallet();
  return wallet;
};
```

### Send Transaction
```typescript
// Send TON payment
const sendPayment = async (amount: string, destination: string) => {
  const transaction = {
    validUntil: Math.floor(Date.now() / 1000) + 60,
    messages: [{
      address: destination,
      amount: amount,
    }]
  };
  return await tonConnectUI.sendTransaction(transaction);
};
```

## Audius Integration APIs

### Track Discovery
```typescript
// Get trending tracks
const getTrendingTracks = async () => {
  const response = await fetch('/api/audius/trending');
  return response.json();
};
```

### Artist Information
```typescript
// Get artist profile
const getArtistProfile = async (artistId: string) => {
  const response = await fetch(`/api/audius/artist/${artistId}`);
  return response.json();
};
```

## Combined Features

### Production Smart Contract Integration

```typescript
// Production NFT Minting
const mintNFT = async (trackId: string, tier: 'bronze' | 'silver' | 'gold' | 'platinum') => {
  const contracts = {
    NFT_COLLECTION: 'EQC8zWiYoJK...', // Live mainnet address
    FAN_CLUB: 'EQD9xYoJK...',
    PAYMENT_PROCESSOR: 'EQE2zWiYoJK...',
    REWARD_DISTRIBUTOR: 'EQF3zWiYoJK...'
  };
  
  const transaction = {
    validUntil: Math.floor(Date.now() / 1000) + 60,
    messages: [{
      address: contracts.NFT_COLLECTION,
      amount: getTierPrice(tier), // 0.1, 0.5, 1.0, 2.0 TON
      payload: createMintPayload({ trackId, tier, recipient: walletAddress })
    }]
  };
  
  return await tonConnectUI.sendTransaction(transaction);
};

// Production Fan Club Membership
const joinFanClub = async (artistId: string, tier: 'basic' | 'premium' | 'vip') => {
  const membershipFee = getMembershipFee(tier);
  const transaction = {
    validUntil: Math.floor(Date.now() / 1000) + 60,
    messages: [{
      address: contracts.FAN_CLUB,
      amount: membershipFee,
      payload: createMembershipPayload({ artistId, tier, duration: '30d' })
    }]
  };
  
  return await tonConnectUI.sendTransaction(transaction);
};

// Live Event Ticketing
const purchaseEventTicket = async (eventId: string, ticketType: string) => {
  const event = await getEventInfo(eventId);
  const transaction = {
    validUntil: Math.floor(Date.now() / 1000) + 60,
    messages: [{
      address: contracts.NFT_COLLECTION,
      amount: event.ticketPrice,
      payload: createTicketPayload({ eventId, ticketType, attendee: walletAddress })
    }]
  };
  
  return await tonConnectUI.sendTransaction(transaction);
};
```

### Production Edge Functions

```typescript
// Get real-time analytics
const getAnalytics = async () => {
  const response = await fetch('/api/analytics/dashboard');
  return response.json();
};

// Real marketplace stats
const getMarketplaceStats = async () => {
  const response = await fetch('/api/marketplace/stats');
  return response.json();
};

// Live event streaming
const joinLiveStream = async (eventId: string) => {
  const response = await fetch(`/api/events/${eventId}/stream`);
  return response.json();
};
```