// Profile field selectors for secure data access
// These ensure sensitive fields are only accessed by authorized users

// Public fields safe for any user to see
export const PUBLIC_PROFILE_FIELDS = [
  'id',
  'display_name',
  'avatar_url', 
  'bio',
  'reputation_score',
  'created_at'
].join(',');

// Full profile fields for authenticated user's own profile
export const FULL_PROFILE_FIELDS = [
  'id',
  'auth_user_id',
  'display_name',
  'avatar_url',
  'bio',
  'reputation_score',
  'wallet_address',
  'ton_dns_name',
  'audio_token_balance',
  'preferred_payment_token',
  'created_at',
  'updated_at'
].join(',');

// Basic fields for wallet-based profiles (no sensitive data)
export const WALLET_PROFILE_FIELDS = [
  'id',
  'display_name',
  'avatar_url',
  'bio',
  'wallet_address',
  'ton_dns_name',
  'reputation_score',
  'created_at'
].join(',');