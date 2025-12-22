/**
 * Pinata IPFS Service
 * 
 * Phase 1: IPFS storage via Pinata API
 * Phase 2 Ready: Architecture prepared for TON Storage integration
 */

import { supabase } from '@/integrations/supabase/client';

export interface IPFSUploadResult {
  success: boolean;
  cid?: string;
  gatewayUrl?: string;
  pinataUrl?: string;
  size?: number;
  error?: string;
  // Phase 2 fields
  tonBagId?: string;
  tonStorageStatus?: 'pending' | 'uploaded' | 'not_configured';
}

export interface IPFSMetadata {
  name?: string;
  description?: string;
  eventId?: string;
  artistId?: string;
  profileId?: string;
  mediaType?: 'thumbnail' | 'recording' | 'track' | 'nft_artwork' | 'avatar';
  [key: string]: any;
}

export interface StorageReference {
  ipfsCid: string;
  ipfsUrl: string;
  // Phase 2: TON Storage fields
  tonBagId?: string;
  tonStorageUrl?: string;
  storageType: 'ipfs' | 'ton' | 'hybrid';
}

class PinataService {
  private readonly edgeFunctionUrl = 'https://cpjjaglmqvcwpzrdoyul.supabase.co/functions/v1/pinata-upload';

  /**
   * Upload a file to IPFS via Pinata
   */
  async uploadFile(
    file: File,
    metadata: IPFSMetadata = {}
  ): Promise<IPFSUploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify({
        ...metadata,
        originalName: file.name,
        mimeType: file.type
      }));

      const response = await fetch(this.edgeFunctionUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const result: IPFSUploadResult = await response.json();
      
      // Log successful uploads for tracking
      if (result.success && result.cid) {
        console.log(`[PinataService] File uploaded: ${result.cid}`, {
          size: result.size,
          type: metadata.mediaType,
          tonStorageStatus: result.tonStorageStatus
        });
      }

      return result;
    } catch (error) {
      console.error('[PinataService] Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Upload JSON metadata to IPFS (useful for NFT metadata)
   */
  async uploadJSON(
    data: Record<string, any>,
    options: { name?: string } = {}
  ): Promise<IPFSUploadResult> {
    try {
      const response = await fetch(this.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'pinJson',
          metadata: data,
          options
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return await response.json();
    } catch (error) {
      console.error('[PinataService] JSON upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'JSON upload failed'
      };
    }
  }

  /**
   * Get gateway URL for a CID
   */
  getGatewayUrl(cid: string, usePinataGateway = true): string {
    if (usePinataGateway) {
      return `https://copper-cheap-canid-320.mypinata.cloud/ipfs/${cid}`;
    }
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }

  /**
   * Unpin content from IPFS (cleanup)
   */
  async unpin(cid: string): Promise<boolean> {
    try {
      const response = await fetch(this.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'unpin',
          cid
        })
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('[PinataService] Unpin error:', error);
      return false;
    }
  }

  /**
   * Upload event thumbnail to IPFS
   */
  async uploadEventThumbnail(
    file: File,
    eventId: string,
    artistId: string
  ): Promise<IPFSUploadResult> {
    return this.uploadFile(file, {
      name: `event-thumbnail-${eventId}`,
      mediaType: 'thumbnail',
      eventId,
      artistId
    });
  }

  /**
   * Upload stream recording to IPFS
   * Phase 2: Will also archive to TON Storage
   */
  async uploadRecording(
    blob: Blob,
    eventId: string,
    metadata: {
      title?: string;
      duration?: number;
      artistId?: string;
    } = {}
  ): Promise<IPFSUploadResult> {
    const file = new File(
      [blob],
      `recording-${eventId}-${Date.now()}.webm`,
      { type: blob.type || 'video/webm' }
    );

    return this.uploadFile(file, {
      name: `event-recording-${eventId}`,
      mediaType: 'recording',
      eventId,
      ...metadata
    });
  }

  /**
   * Upload NFT artwork to IPFS
   */
  async uploadNFTArtwork(
    file: File,
    metadata: {
      trackId?: string;
      artistId?: string;
      collectionName?: string;
    } = {}
  ): Promise<IPFSUploadResult> {
    return this.uploadFile(file, {
      name: metadata.collectionName || 'nft-artwork',
      mediaType: 'nft_artwork',
      ...metadata
    });
  }

  /**
   * Create and upload NFT metadata JSON
   */
  async uploadNFTMetadata(metadata: {
    name: string;
    description: string;
    image: string; // IPFS CID or URL
    attributes?: Array<{ trait_type: string; value: string | number }>;
    external_url?: string;
    animation_url?: string;
    [key: string]: any;
  }): Promise<IPFSUploadResult> {
    // Format for TON NFT standard
    const nftMetadata = {
      name: metadata.name,
      description: metadata.description,
      image: metadata.image.startsWith('ipfs://') 
        ? metadata.image 
        : `ipfs://${metadata.image}`,
      attributes: metadata.attributes || [],
      external_url: metadata.external_url,
      animation_url: metadata.animation_url,
      // Phase 2: Add TON-specific fields
      platform: 'AudioTon',
      created_at: new Date().toISOString()
    };

    return this.uploadJSON(nftMetadata, { name: `${metadata.name}-metadata.json` });
  }

  /**
   * Create storage reference object for database storage
   * This abstraction allows easy migration to Phase 2 hybrid storage
   */
  createStorageReference(uploadResult: IPFSUploadResult): StorageReference | null {
    if (!uploadResult.success || !uploadResult.cid) {
      return null;
    }

    return {
      ipfsCid: uploadResult.cid,
      ipfsUrl: uploadResult.gatewayUrl || this.getGatewayUrl(uploadResult.cid),
      tonBagId: uploadResult.tonBagId,
      storageType: uploadResult.tonBagId ? 'hybrid' : 'ipfs'
    };
  }

  /**
   * Phase 2 Placeholder: Archive to TON Storage
   * This will be implemented when TON Storage daemon is set up
   */
  async archiveToTonStorage(cid: string): Promise<{ bagId?: string; status: string }> {
    console.log('[PinataService] TON Storage archival not yet implemented for CID:', cid);
    return {
      status: 'not_configured'
    };
  }

  /**
   * Phase 2 Placeholder: Check TON Storage status
   */
  async getTonStorageStatus(cid: string): Promise<{
    archived: boolean;
    bagId?: string;
    providerCount?: number;
  }> {
    return {
      archived: false
    };
  }
}

export const pinataService = new PinataService();
export default pinataService;
