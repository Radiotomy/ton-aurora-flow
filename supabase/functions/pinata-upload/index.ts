import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest, isAllowedOrigin } from "../_shared/cors.ts";

const PINATA_API_KEY = Deno.env.get('PINATA_API_KEY');
const PINATA_SECRET_KEY = Deno.env.get('PINATA_SECRET_KEY');

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  isDuplicate?: boolean;
}

interface UploadResult {
  success: boolean;
  cid?: string;
  gatewayUrl?: string;
  pinataUrl?: string;
  size?: number;
  error?: string;
  // Phase 2 placeholder fields for TON Storage
  tonBagId?: string;
  tonStorageStatus?: 'pending' | 'uploaded' | 'not_configured';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      console.error('Pinata API keys not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Pinata API keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    
    let result: UploadResult;

    if (contentType.includes('application/json')) {
      // Handle JSON metadata pinning
      const body = await req.json();
      
      if (body.action === 'pinJson') {
        result = await pinJsonToIPFS(body.metadata, body.options);
      } else if (body.action === 'unpin') {
        result = await unpinFromIPFS(body.cid);
      } else if (body.action === 'getGatewayUrl') {
        result = {
          success: true,
          cid: body.cid,
          gatewayUrl: `https://gateway.pinata.cloud/ipfs/${body.cid}`,
          pinataUrl: `https://copper-cheap-canid-320.mypinata.cloud/ipfs/${body.cid}`,
          tonStorageStatus: 'not_configured' // Phase 2 placeholder
        };
      } else {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const metadata = formData.get('metadata') as string;
      const options = formData.get('options') as string;

      if (!file) {
        return new Response(
          JSON.stringify({ success: false, error: 'No file provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate file size (max 100MB for media)
      const MAX_FILE_SIZE = 100 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        return new Response(
          JSON.stringify({ success: false, error: 'File too large. Maximum size is 100MB' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const parsedMetadata = metadata ? JSON.parse(metadata) : {};
      const parsedOptions = options ? JSON.parse(options) : {};

      result = await pinFileToIPFS(file, parsedMetadata, parsedOptions);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Unsupported content type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Pinata operation result:', result);

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Pinata upload error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function pinFileToIPFS(
  file: File, 
  metadata: Record<string, any> = {}, 
  options: Record<string, any> = {}
): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    // Add Pinata metadata
    const pinataMetadata = {
      name: metadata.name || file.name,
      keyvalues: {
        ...metadata,
        uploadedAt: new Date().toISOString(),
        contentType: file.type,
        fileSize: file.size.toString(),
        // Phase 2 preparation: mark for TON Storage archival
        tonStoragePending: 'true',
        sourceApp: 'audioton'
      }
    };
    formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

    // Add Pinata options
    const pinataOptions = {
      cidVersion: 1,
      ...options
    };
    formData.append('pinataOptions', JSON.stringify(pinataOptions));

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': PINATA_API_KEY!,
        'pinata_secret_api_key': PINATA_SECRET_KEY!
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pinata API error:', errorText);
      throw new Error(`Pinata API error: ${response.status}`);
    }

    const data: PinataResponse = await response.json();
    
    return {
      success: true,
      cid: data.IpfsHash,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
      pinataUrl: `https://copper-cheap-canid-320.mypinata.cloud/ipfs/${data.IpfsHash}`,
      size: data.PinSize,
      // Phase 2 placeholder: TON Storage integration
      tonStorageStatus: 'pending'
    };
  } catch (error) {
    console.error('Pin file error:', error);
    return { success: false, error: error.message };
  }
}

async function pinJsonToIPFS(
  jsonData: Record<string, any>,
  options: Record<string, any> = {}
): Promise<UploadResult> {
  try {
    const body = {
      pinataContent: jsonData,
      pinataMetadata: {
        name: options.name || 'metadata.json',
        keyvalues: {
          uploadedAt: new Date().toISOString(),
          type: 'json_metadata',
          tonStoragePending: 'true',
          sourceApp: 'audioton'
        }
      },
      pinataOptions: {
        cidVersion: 1
      }
    };

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY!,
        'pinata_secret_api_key': PINATA_SECRET_KEY!
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pinata JSON API error:', errorText);
      throw new Error(`Pinata API error: ${response.status}`);
    }

    const data: PinataResponse = await response.json();

    return {
      success: true,
      cid: data.IpfsHash,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
      pinataUrl: `https://copper-cheap-canid-320.mypinata.cloud/ipfs/${data.IpfsHash}`,
      size: data.PinSize,
      tonStorageStatus: 'pending'
    };
  } catch (error) {
    console.error('Pin JSON error:', error);
    return { success: false, error: error.message };
  }
}

async function unpinFromIPFS(cid: string): Promise<UploadResult> {
  try {
    const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
      method: 'DELETE',
      headers: {
        'pinata_api_key': PINATA_API_KEY!,
        'pinata_secret_api_key': PINATA_SECRET_KEY!
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to unpin: ${response.status}`);
    }

    return { success: true, cid };
  } catch (error) {
    console.error('Unpin error:', error);
    return { success: false, error: error.message };
  }
}
