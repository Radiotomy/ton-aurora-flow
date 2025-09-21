/**
 * Production configuration for AudioTon
 * Contains environment-specific settings for mainnet deployment
 */

export const PRODUCTION_CONFIG = {
  // API Endpoints
  API_BASE_URL: 'https://cpjjaglmqvcwpzrdoyul.supabase.co',
  AUDIUS_API_URL: 'https://discoveryprovider.audius.co',
  
  // Chainstack Configuration (Primary) 
  CHAINSTACK_API_URL: 'https://nd-123-456-789.p2pify.com', // Replace with your actual endpoint
  CHAINSTACK_API_VERSION: 'v3',
  
  // TonCenter Configuration (Fallback)
  TON_API_URL: 'https://toncenter.com/api/v2',
  
  // Blockchain Configuration
  TON_NETWORK: 'mainnet' as const,
  TON_WORKCHAIN: 0,
  
  // Smart Contract Addresses (Production - DEPLOYED TO MAINNET)
  CONTRACTS: {
    NFT_COLLECTION: 'EQCFHSooX5Yc4OFivHybZGtRHti319ypbxhKpvQz_q1d1gLT',
    FAN_CLUB: 'EQDKCkiHTgT8H9NqMq5002oub3XrDJPIifBJ0gJGWx_N78ub',
    PAYMENT_PROCESSOR: 'EQBEhEAjFgWja2HD23lN3Z-_AWk6hBb2vWfqqvDudMweXP4t',
    REWARD_DISTRIBUTOR: 'EQAOPjSEGosElkZ9UmxJioIxqzkgRCSlCIacVOJN0at0wKRU'
  },

  // Deployment Configuration
  DEPLOYMENT: {
    DEPLOYER_MNEMONIC: process.env.DEPLOYER_MNEMONIC,
    MIN_BALANCE_FOR_DEPLOYMENT: '5.0', // TON
    DEPLOYMENT_TIMEOUT: 300000, // 5 minutes
    CONFIRMATION_BLOCKS: 2
  },
  
  // Transaction Configuration
  TRANSACTION_TIMEOUT: 60000, // 1 minute
  MAX_RETRY_ATTEMPTS: 3,
  GAS_LIMITS: {
    NFT_MINT: '0.1', // TON
    TIP: '0.05',
    FAN_CLUB_JOIN: '0.08',
    TOKEN_TRANSFER: '0.03'
  },
  
  // Rate Limiting
  RATE_LIMITS: {
    WALLET_CONNECTION: { attempts: 5, windowMs: 60000 },
    TRANSACTIONS: { attempts: 10, windowMs: 300000 },
    NFT_MINTING: { attempts: 3, windowMs: 300000 },
    API_CALLS: { attempts: 100, windowMs: 60000 }
  },
  
  // Feature Flags
  FEATURES: {
    CROSS_CHAIN_BRIDGE: true,
    LIVE_STREAMING: true,
    AI_RECOMMENDATIONS: true,
    VOICE_SEARCH: true,
    TELEGRAM_INTEGRATION: true,
    ANALYTICS: true,
    TON_SITES: true,
    TON_DNS: true,
    TON_PROXY: true
  },
  
  // Security Configuration
  SECURITY: {
    HTTPS_ONLY: true,
    CONTENT_SECURITY_POLICY: true,
    RATE_LIMITING: true,
    ADDRESS_VALIDATION: true,
    INPUT_SANITIZATION: true
  },
  
  // Performance Configuration
  PERFORMANCE: {
    IMAGE_OPTIMIZATION: true,
    LAZY_LOADING: true,
    CDN_ENABLED: true,
    CACHING: {
      STATIC_ASSETS: 31536000, // 1 year
      API_RESPONSES: 300, // 5 minutes  
      USER_PROFILES: 900 // 15 minutes
    }
  },
  
  // Analytics Configuration
  ANALYTICS: {
    TRACK_WALLET_CONNECTIONS: true,
    TRACK_TRANSACTIONS: true,
    TRACK_USER_ENGAGEMENT: true,
    TRACK_PERFORMANCE: true
  },
  
  // Telegram Web App Configuration
  TELEGRAM: {
    BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    WEB_APP_URL: 'https://audioton.co',
    RETURN_URL: 'https://audioton.co',
    HAPTIC_FEEDBACK: true,
    THEME_PARAMS: true
  },

  // Production Domain Configuration
  DOMAIN: {
    PRIMARY: 'https://audioton.co',
    TON_DOMAIN: 'audioton.ton',
    MANIFEST_BASE: 'https://audioton.co',
    CORS_ORIGINS: [
      'https://audioton.co',
      'https://t.me',
      'https://web.telegram.org'
    ]
  },

  // TON Sites Configuration
  TON_SITES: {
    ENABLED: true,
    DOMAIN: 'audioton.ton',
    PROXY_ENABLED: true,
    MANIFEST_URL: '/ton-site-manifest.json',
    DNS_RESOLVER: 'https://dns.ton.org',
    SITE_BAG_ID: '32902580153715398944', // Example bag ID for TON Storage
    BACKUP_URLS: [
      'https://082eb0ee-579e-46a8-a35f-2d335fe4e344.lovableproject.com',
      'https://audioton.co'
    ]
  },
  
  // Content Delivery
  CDN: {
    IMAGES_URL: 'https://cpjjaglmqvcwpzrdoyul.supabase.co/storage/v1/object/public',
    AUDIO_URL: 'https://cpjjaglmqvcwpzrdoyul.supabase.co/storage/v1/object/public',
    STATIC_URL: 'https://audioton.co'
  },
  
  // Legal & Compliance
  LEGAL: {
    TERMS_VERSION: '1.0',
    PRIVACY_VERSION: '1.0',
    COOKIE_CONSENT: true,
    GDPR_COMPLIANCE: true
  }
} as const;

// Development overrides
export const DEVELOPMENT_CONFIG = {
  ...PRODUCTION_CONFIG,
  TON_NETWORK: 'testnet' as const,
  
  // Chainstack testnet endpoint
  CHAINSTACK_API_URL: 'https://nd-123-456-789.p2pify.com', // Replace with your testnet endpoint
  
  CONTRACTS: {
    NFT_COLLECTION: 'kQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG',
    FAN_CLUB: 'kQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    PAYMENT_PROCESSOR: 'kQAO3fiaxUvVqCBaZdnfKCgC0wOp-NJXBOZGaAamOEJ8NJU4',
    REWARD_DISTRIBUTOR: 'kQC5vfkGas_SBp85WVqm_xo4lKelOhv3rPAO6ILdgD2lNvY_'
  },
  SECURITY: {
    ...PRODUCTION_CONFIG.SECURITY,
    HTTPS_ONLY: false // Allow HTTP in development
  },
  TELEGRAM: {
    ...PRODUCTION_CONFIG.TELEGRAM,
    WEB_APP_URL: 'http://localhost:8080',
    RETURN_URL: 'http://localhost:8080'
  }
} as const;

// Export the appropriate config based on environment
export const APP_CONFIG = process.env.NODE_ENV === 'production' 
  ? PRODUCTION_CONFIG 
  : DEVELOPMENT_CONFIG;

// Validation function to ensure all required config is present
export const validateConfig = (): boolean => {
  const requiredFields = [
    'API_BASE_URL',
    'TON_NETWORK',
    'CONTRACTS.NFT_COLLECTION',
    'CONTRACTS.PAYMENT_PROCESSOR'
  ];
  
  return requiredFields.every(field => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], APP_CONFIG as any);
    return value !== undefined && value !== null && value !== '';
  });
};

// Environment-specific utilities
export const isProduction = () => process.env.NODE_ENV === 'production';
export const isDevelopment = () => process.env.NODE_ENV === 'development';
export const isTelegram = () => typeof window !== 'undefined' && window.Telegram?.WebApp;

// Export commonly used values
export const {
  TON_NETWORK,
  CONTRACTS,
  RATE_LIMITS,
  FEATURES,
  PERFORMANCE,
  TELEGRAM
} = APP_CONFIG;