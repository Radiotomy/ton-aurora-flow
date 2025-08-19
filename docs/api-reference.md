# API Reference

## TON Integration APIs

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

### Track Interaction Flow
```typescript
// Complete track interaction with TON payment
const interactWithTrack = async (trackId: string, action: 'tip' | 'collect') => {
  // 1. Get track info from Audius
  const track = await getTrackInfo(trackId);
  
  // 2. Process payment via TON
  if (action === 'tip') {
    await sendPayment(tipAmount, track.artistWallet);
  }
  
  // 3. Record interaction in database
  await recordInteraction({ trackId, action, userId });
};
```