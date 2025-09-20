/**
 * AudioTon Compiled Contract Exports
 * Real production bytecode for mainnet deployment
 */

export { getPaymentContractCode, isPlaceholder as isPaymentPlaceholder } from './payment';
export { getNFTCollectionContractCode, isPlaceholder as isNFTCollectionPlaceholder } from './nft-collection';
export { getFanClubContractCode, isPlaceholder as isFanClubPlaceholder } from './fan-club';
export { getRewardDistributorContractCode, isPlaceholder as isRewardDistributorPlaceholder } from './reward-distributor';

// Check if any contracts are using placeholder code
export const hasPlaceholderContracts = () => {
  const { isPaymentPlaceholder } = require('./payment');
  const { isNFTCollectionPlaceholder } = require('./nft-collection');
  const { isFanClubPlaceholder } = require('./fan-club');
  const { isRewardDistributorPlaceholder } = require('./reward-distributor');
  
  return isPaymentPlaceholder || isNFTCollectionPlaceholder || isFanClubPlaceholder || isRewardDistributorPlaceholder;
};

export const getPlaceholderContractsList = () => {
  const placeholders = [];
  const { isPaymentPlaceholder } = require('./payment');
  const { isNFTCollectionPlaceholder } = require('./nft-collection');
  const { isFanClubPlaceholder } = require('./fan-club');
  const { isRewardDistributorPlaceholder } = require('./reward-distributor');
  
  if (isPaymentPlaceholder) placeholders.push('Payment Processor');
  if (isNFTCollectionPlaceholder) placeholders.push('NFT Collection');
  if (isFanClubPlaceholder) placeholders.push('Fan Club');
  if (isRewardDistributorPlaceholder) placeholders.push('Reward Distributor');
  
  return placeholders;
};