/**
 * AudioTon Compiled Contract Exports
 * Real production bytecode for mainnet deployment
 */

export { getPaymentContractCode, isPlaceholder as isPaymentPlaceholder } from './payment';
export { getNFTCollectionContractCode, isPlaceholder as isNFTCollectionPlaceholder } from './nft-collection';
export { getFanClubContractCode, isPlaceholder as isFanClubPlaceholder } from './fan-club';
export { getRewardDistributorContractCode, isPlaceholder as isRewardDistributorPlaceholder } from './reward-distributor';

// Check if any contracts are using placeholder code
import { isPlaceholder as _isPaymentPlaceholder } from './payment';
import { isPlaceholder as _isNFTCollectionPlaceholder } from './nft-collection';
import { isPlaceholder as _isFanClubPlaceholder } from './fan-club';
import { isPlaceholder as _isRewardDistributorPlaceholder } from './reward-distributor';

export const hasPlaceholderContracts = () => {
  return _isPaymentPlaceholder || _isNFTCollectionPlaceholder || _isFanClubPlaceholder || _isRewardDistributorPlaceholder;
};

export const getPlaceholderContractsList = () => {
  const placeholders: string[] = [];
  if (_isPaymentPlaceholder) placeholders.push('Payment Processor');
  if (_isNFTCollectionPlaceholder) placeholders.push('NFT Collection');
  if (_isFanClubPlaceholder) placeholders.push('Fan Club');
  if (_isRewardDistributorPlaceholder) placeholders.push('Reward Distributor');
  return placeholders;
};