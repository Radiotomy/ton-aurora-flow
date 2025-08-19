# AudioTon Developer Integration Guide

## Overview

AudioTon provides a comprehensive API and SDK for developers to integrate Web3 music functionality into their applications. This guide covers everything from basic integration to advanced features.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication & Wallet Integration](#authentication--wallet-integration)
3. [Music Streaming APIs](#music-streaming-apis)
4. [NFT & Blockchain Integration](#nft--blockchain-integration)
5. [Smart Contract Interaction](#smart-contract-interaction)
6. [Webhook Integration](#webhook-integration)
7. [SDK Reference](#sdk-reference)
8. [Code Examples](#code-examples)

## Getting Started

### Prerequisites

- Node.js 18+ or compatible JavaScript environment
- TON Connect SDK
- Basic understanding of blockchain concepts
- Audius Protocol familiarity (optional)

### Installation

```bash
npm install @audioton/sdk @tonconnect/ui-react
```

### Quick Setup

```typescript
import { AudioTonSDK } from '@audioton/sdk';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

// Initialize SDK
const audioton = new AudioTonSDK({
  network: 'mainnet', // or 'testnet'
  apiKey: 'your-api-key', // Get from AudioTon Dashboard
});

// Wrap your app with providers
function App() {
  return (
    <TonConnectUIProvider manifestUrl="/tonconnect-manifest.json">
      <YourAppComponents />
    </TonConnectUIProvider>
  );
}
```

## Authentication & Wallet Integration

### TON Connect Integration

```typescript
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';

export function WalletIntegration() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  const connectWallet = async () => {
    try {
      await tonConnectUI.connectWallet();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const sendTransaction = async (transaction) => {
    if (!wallet) throw new Error('Wallet not connected');
    
    return await tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [transaction]
    });
  };

  return (
    <div>
      {wallet ? (
        <p>Connected: {wallet.account.address}</p>
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
    </div>
  );
}
```

### User Profile Management

```typescript
// Create or fetch user profile
const profile = await audioton.profiles.getOrCreate({
  walletAddress: wallet.account.address,
  displayName: 'User Display Name',
});

// Update profile
await audioton.profiles.update(profile.id, {
  displayName: 'New Name',
  bio: 'Music lover and Web3 enthusiast',
  avatar: 'https://example.com/avatar.jpg'
});
```

## Music Streaming APIs

### Track Discovery

```typescript
// Get trending tracks
const trending = await audioton.tracks.getTrending({
  genre: 'electronic',
  limit: 20,
  timeframe: '7d' // 1d, 7d, 30d, all
});

// Search tracks
const searchResults = await audioton.tracks.search({
  query: 'deadmau5',
  type: 'track', // track, artist, playlist
  limit: 50
});

// Get track details
const track = await audioton.tracks.getById('track-id');
```

### Playlist Management

```typescript
// Create playlist
const playlist = await audioton.playlists.create({
  name: 'My Web3 Playlist',
  description: 'Favorite NFT tracks',
  isPublic: true
});

// Add tracks to playlist
await audioton.playlists.addTracks(playlist.id, [
  'track-id-1',
  'track-id-2'
]);

// Get user playlists
const userPlaylists = await audioton.playlists.getByUser(userId);
```

### Audio Playback

```typescript
// Initialize audio player
const player = new AudioTonPlayer({
  apiKey: 'your-api-key',
  onTrackChange: (track) => console.log('Now playing:', track.title),
  onPlaybackEnd: (track) => recordListeningSession(track)
});

// Play track
await player.play('track-id');

// Control playback
player.pause();
player.resume();
player.setVolume(0.8);
player.seekTo(30); // seconds
```

## NFT & Blockchain Integration

### NFT Minting

```typescript
// Mint music NFT
const mintResult = await audioton.nfts.mint({
  trackId: 'track-id',
  tier: 'gold', // bronze, silver, gold, platinum
  quantity: 1,
  metadata: {
    title: 'Track Title',
    artist: 'Artist Name',
    description: 'Limited edition music NFT'
  }
});

// Wait for transaction confirmation
const receipt = await audioton.transactions.waitForConfirmation(
  mintResult.transactionHash
);
```

### NFT Management

```typescript
// Get user's NFT collection
const collection = await audioton.nfts.getByOwner(walletAddress);

// Transfer NFT
await audioton.nfts.transfer({
  nftId: 'nft-id',
  toAddress: 'recipient-address',
  fromAddress: walletAddress
});

// Get NFT metadata
const metadata = await audioton.nfts.getMetadata('nft-id');
```

### Artist Tipping

```typescript
// Send tip to artist
const tipResult = await audioton.tips.send({
  artistId: 'artist-id',
  amount: '0.1', // TON amount
  message: 'Love your music!',
  trackId: 'track-id' // optional
});

// Get tipping history
const tips = await audioton.tips.getHistory(userId);
```

## Smart Contract Interaction

### Contract Addresses

```typescript
const CONTRACTS = {
  NFT_COLLECTION: 'EQC8zWiYoJK...', // Mainnet addresses
  FAN_CLUB: 'EQD9xYoJK...',
  PAYMENT_PROCESSOR: 'EQE2zWiYoJK...',
  REWARD_DISTRIBUTOR: 'EQF3zWiYoJK...'
};
```

### Custom Contract Calls

```typescript
import { SmartContractHelper } from '@audioton/sdk';

const helper = new SmartContractHelper();

// Create custom transaction
const transaction = helper.createTransaction([
  {
    address: CONTRACTS.NFT_COLLECTION,
    amount: helper.tonToNano(0.1),
    payload: helper.createNFTMintPayload({
      trackId: 'track-id',
      tier: 'gold',
      recipient: walletAddress
    })
  }
]);

// Send transaction
const result = await tonConnectUI.sendTransaction(transaction);
```

### Gas Optimization

```typescript
// Estimate transaction fees
const estimate = await audioton.transactions.estimateFee({
  type: 'nft_mint',
  tier: 'gold',
  quantity: 1
});

// Batch multiple operations
const batchTransaction = helper.createTransaction([
  // Mint NFT
  {
    address: CONTRACTS.NFT_COLLECTION,
    amount: helper.tonToNano(0.1),
    payload: mintPayload
  },
  // Join Fan Club
  {
    address: CONTRACTS.FAN_CLUB,
    amount: helper.tonToNano(0.05),
    payload: fanClubPayload
  }
]);
```

## Webhook Integration

### Setting Up Webhooks

```typescript
// Configure webhook endpoints
await audioton.webhooks.create({
  url: 'https://your-app.com/webhooks/audioton',
  events: [
    'nft.minted',
    'tip.received',
    'fan_club.joined',
    'track.played'
  ],
  secret: 'your-webhook-secret'
});
```

### Webhook Event Handling

```typescript
import express from 'express';
import crypto from 'crypto';

const app = express();

app.post('/webhooks/audioton', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['x-audioton-signature'];
  const payload = req.body;
  
  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
    
  if (signature !== `sha256=${expectedSignature}`) {
    return res.status(401).send('Invalid signature');
  }
  
  const event = JSON.parse(payload);
  
  switch (event.type) {
    case 'nft.minted':
      handleNFTMinted(event.data);
      break;
    case 'tip.received':
      handleTipReceived(event.data);
      break;
    case 'fan_club.joined':
      handleFanClubJoined(event.data);
      break;
  }
  
  res.status(200).send('OK');
});
```

## SDK Reference

### AudioTonSDK Class

```typescript
class AudioTonSDK {
  constructor(config: SDKConfig);
  
  // Core modules
  tracks: TracksModule;
  artists: ArtistsModule;
  nfts: NFTModule;
  tips: TipsModule;
  fanClubs: FanClubModule;
  profiles: ProfilesModule;
  playlists: PlaylistsModule;
  
  // Utility methods
  utils: UtilsModule;
  transactions: TransactionsModule;
  webhooks: WebhooksModule;
}
```

### Configuration Options

```typescript
interface SDKConfig {
  network: 'mainnet' | 'testnet';
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  retries?: number;
  debug?: boolean;
}
```

### Error Handling

```typescript
try {
  const result = await audioton.nfts.mint(params);
} catch (error) {
  if (error instanceof AudioTonError) {
    switch (error.code) {
      case 'INSUFFICIENT_BALANCE':
        // Handle insufficient balance
        break;
      case 'INVALID_TRACK_ID':
        // Handle invalid track
        break;
      case 'NETWORK_ERROR':
        // Handle network issues
        break;
    }
  }
}
```

## Code Examples

### Complete Track Player Integration

```typescript
import React, { useState, useEffect } from 'react';
import { AudioTonSDK, AudioTonPlayer } from '@audioton/sdk';

export function MusicPlayer() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    const audioPlayer = new AudioTonPlayer({
      onTrackChange: setCurrentTrack,
      onPlayStateChange: setIsPlaying,
      onError: (error) => console.error('Playback error:', error)
    });
    
    setPlayer(audioPlayer);
    
    return () => audioPlayer.destroy();
  }, []);

  const playTrack = async (trackId) => {
    try {
      await player.play(trackId);
      
      // Record listening session
      await audioton.tracks.recordPlay({
        trackId,
        userId: currentUser.id,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to play track:', error);
    }
  };

  return (
    <div className="music-player">
      {currentTrack && (
        <div className="now-playing">
          <img src={currentTrack.artwork} alt={currentTrack.title} />
          <div>
            <h3>{currentTrack.title}</h3>
            <p>{currentTrack.artist}</p>
          </div>
          <button onClick={() => player.toggle()}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
      )}
    </div>
  );
}
```

### NFT Marketplace Integration

```typescript
export function NFTMarketplace() {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarketplaceNFTs();
  }, []);

  const loadMarketplaceNFTs = async () => {
    try {
      const marketplaceNFTs = await audioton.nfts.getMarketplace({
        status: 'for_sale',
        sortBy: 'price_asc',
        limit: 50
      });
      setNfts(marketplaceNFTs);
    } catch (error) {
      console.error('Failed to load NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const purchaseNFT = async (nftId, price) => {
    try {
      const result = await audioton.nfts.purchase({
        nftId,
        price,
        buyerAddress: wallet.account.address
      });
      
      // Wait for confirmation
      await audioton.transactions.waitForConfirmation(result.transactionHash);
      
      // Refresh marketplace
      loadMarketplaceNFTs();
      
      toast.success('NFT purchased successfully!');
    } catch (error) {
      toast.error('Purchase failed: ' + error.message);
    }
  };

  return (
    <div className="nft-marketplace">
      {loading ? (
        <div>Loading NFTs...</div>
      ) : (
        <div className="nft-grid">
          {nfts.map(nft => (
            <NFTCard 
              key={nft.id} 
              nft={nft} 
              onPurchase={() => purchaseNFT(nft.id, nft.price)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Fan Club Integration

```typescript
export function FanClubComponent({ artistId }) {
  const [fanClub, setFanClub] = useState(null);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    loadFanClub();
    checkMembership();
  }, [artistId]);

  const loadFanClub = async () => {
    const club = await audioton.fanClubs.getByArtist(artistId);
    setFanClub(club);
  };

  const checkMembership = async () => {
    if (!wallet?.account?.address) return;
    
    const membership = await audioton.fanClubs.getMembership({
      artistId,
      userAddress: wallet.account.address
    });
    
    setIsMember(!!membership && !membership.expired);
  };

  const joinFanClub = async (tier) => {
    try {
      const result = await audioton.fanClubs.join({
        artistId,
        tier,
        duration: '1month' // 1month, 3months, 1year
      });
      
      await audioton.transactions.waitForConfirmation(result.transactionHash);
      setIsMember(true);
      
      toast.success(`Welcome to ${fanClub.name}!`);
    } catch (error) {
      toast.error('Failed to join fan club: ' + error.message);
    }
  };

  return (
    <div className="fan-club">
      <h2>{fanClub?.name}</h2>
      <p>{fanClub?.description}</p>
      
      {isMember ? (
        <div className="member-content">
          <h3>Exclusive Content</h3>
          {/* Member-only content */}
        </div>
      ) : (
        <div className="membership-tiers">
          {fanClub?.tiers.map(tier => (
            <div key={tier.id} className="tier-card">
              <h3>{tier.name}</h3>
              <p>{tier.price} TON/month</p>
              <ul>
                {tier.benefits.map(benefit => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
              <button onClick={() => joinFanClub(tier.id)}>
                Join for {tier.price} TON
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Testing & Development

### Test Environment Setup

```typescript
// Test configuration
const testSDK = new AudioTonSDK({
  network: 'testnet',
  apiKey: 'test-api-key',
  debug: true
});

// Mock wallet for testing
const mockWallet = {
  account: {
    address: 'EQTest...',
    chain: '-239'
  }
};
```

### Unit Testing Examples

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { AudioTonSDK } from '@audioton/sdk';

describe('AudioTon SDK', () => {
  let sdk;
  
  beforeEach(() => {
    sdk = new AudioTonSDK({
      network: 'testnet',
      apiKey: 'test-key'
    });
  });

  it('should fetch trending tracks', async () => {
    const tracks = await sdk.tracks.getTrending({ limit: 10 });
    expect(tracks).toHaveLength(10);
    expect(tracks[0]).toHaveProperty('id');
    expect(tracks[0]).toHaveProperty('title');
  });

  it('should mint NFT successfully', async () => {
    const result = await sdk.nfts.mint({
      trackId: 'test-track-id',
      tier: 'bronze',
      quantity: 1
    });
    
    expect(result).toHaveProperty('transactionHash');
    expect(result).toHaveProperty('nftId');
  });
});
```

## Best Practices

### Performance Optimization

1. **Cache frequently accessed data**
2. **Use pagination for large datasets**
3. **Implement proper error boundaries**
4. **Optimize bundle size with tree shaking**
5. **Use React.memo for expensive components**

### Security Considerations

1. **Never store private keys in frontend code**
2. **Validate all user inputs**
3. **Use HTTPS for all API calls**
4. **Implement proper CORS policies**
5. **Sanitize webhook payloads**

### User Experience

1. **Provide loading states for all async operations**
2. **Handle network failures gracefully**
3. **Show clear error messages**
4. **Implement optimistic UI updates**
5. **Cache audio for offline playback**

## Support & Resources

- 📚 [API Documentation](https://docs.audioton.io/api)
- 💬 [Developer Discord](https://discord.gg/audioton-dev)
- 🐛 [Issue Tracker](https://github.com/audioton/issues)
- 📧 [Developer Support](mailto:dev@audioton.io)

---

*For the latest updates and features, always refer to the [official documentation](https://docs.audioton.io).*