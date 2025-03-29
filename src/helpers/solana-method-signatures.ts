import {
  Transaction,
  PublicKey,
  SystemProgram,
  Connection,
} from '@solana/web3.js';
import type { Commitment } from '@solana/web3.js';
// eslint-disable-next-line
import { Buffer } from 'buffer';

import { FEATURED_NETWORKS } from '../constants/networks';

window.Buffer = Buffer;

const SOLANA_RPC_CONFIG = {
  endpoints: [
    'https://api.helius-rpc.com/?api-key=15319146-89d5-4685-a3c4-811991e5212f', // Free tier Helius endpoint (for demo only)
    'https://api.devnet.solana.com', // Devnet for testing
    'https://api.mainnet-beta.solana.com', // Public endpoint (rate limited)
  ],
  commitment: 'confirmed' as Commitment,
  // Fallback blockhash in case all RPC endpoints fail
  fallbackBlockhash: 'EETubP5AKHgjPAhzPAFcb8BAY1hMH639CWCFTqi3hq1k',
};

const generateBase64Transaction = async (address: string) => {
  const publicKey = new PublicKey(address);

  let blockhash;
  let error;

  for (const endpoint of SOLANA_RPC_CONFIG.endpoints) {
    try {
      const connection = new Connection(endpoint, SOLANA_RPC_CONFIG.commitment);
      const response = await connection.getLatestBlockhash();
      blockhash = response.blockhash;
      console.log(`Successfully connected to Solana RPC endpoint`);
      break;
    } catch (connectionError) {
      console.error(`Failed to connect to RPC endpoint:`, connectionError);
      error = connectionError;
    }
  }

  // If all endpoints failed, use the fallback blockhash
  if (!blockhash) {
    console.warn('All RPC endpoints failed, using fallback blockhash');
    blockhash = SOLANA_RPC_CONFIG.fallbackBlockhash;
    console.error('Original error:', error);
  }

  const transaction = new Transaction();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = publicKey;

  transaction.add(
    SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: publicKey,
      lamports: 1000,
    }),
  );

  const serializedTransaction = transaction.serialize({
    verifySignatures: false,
  });
  const base64Transaction = btoa(
    String.fromCharCode.apply(null, [...new Uint8Array(serializedTransaction)]),
  );

  return base64Transaction;
};

const stringToBase64 = (str: string): string => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return btoa(String.fromCharCode.apply(null, [...bytes]));
};

export const generateSolanaMethodExamples = async (
  method: string,
  address: string,
) => {
  switch (method) {
    case 'signMessage':
      return {
        params: {
          account: { address },
          message: stringToBase64('Hello, world!'),
        },
      };
    case 'signTransaction':
      return {
        params: {
          account: { address },
          transaction: await generateBase64Transaction(address),
          scope: FEATURED_NETWORKS['Solana Mainnet'],
        },
      };
    case 'signAllTransactions':
      return {
        params: {
          account: { address },
          transactions: [
            await generateBase64Transaction(address),
            await generateBase64Transaction(address),
          ],
          scope: FEATURED_NETWORKS['Solana Mainnet'],
        },
      };
    case 'signAndSendTransaction':
      return {
        params: {
          account: { address },
          transaction: await generateBase64Transaction(address),
          scope: FEATURED_NETWORKS['Solana Mainnet'],
        },
      };
    case 'signIn':
      return {
        params: {
          address,
          domain: window.location.host,
          statement: 'Please sign in.',
        },
      };
    case 'getGenesisHash':
      return {
        params: {},
      };
    default:
      return {};
  }
};
