import { Transaction, PublicKey, SystemProgram } from '@solana/web3.js';
// eslint-disable-next-line
import { Buffer } from 'buffer';
import { FEATURED_NETWORKS } from '../constants/networks';

window.Buffer = Buffer;

const generateBase64Transaction = (address: string) => {
  try {
    const publicKey = new PublicKey(address);

    const transaction = new Transaction();
    transaction.recentBlockhash =
      'EETubP5AKHgjPAhzPAFcb8BAY1hMH639CWCFTqi3hq1k';
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
      String.fromCharCode.apply(null, [
        ...new Uint8Array(serializedTransaction),
      ]),
    );

    return base64Transaction;
  } catch (error) {
    console.error('Error generating transaction:', error);
    // Fallback to a pre-encoded transaction in case of errors
    return 'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDAgROw8oBzcUQJ3MAAAAAAAMCAgABDAIAAQwAAAAAAJnXk2sByMsAAAAAGGSF776IFi6/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAvQMAAAAAAAAAjEBiYVkSY3oXgvOs8iINDpa98gy8Q+E69vdmZjirciE7xBwmP4LHikKQZRLRjmJJrCJqVIup3YR6sUje0UYfcgsBAAAAAAAAAGQJa0ZXrO6tLjQ1XnnNJQgQI3cAAAAAAA==';
  }
};

// Helper function to convert string to base64
const stringToBase64 = (str: string): string => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return btoa(String.fromCharCode.apply(null, [...bytes]));
};

export const generateSolanaMethodExamples = (
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
          transaction: generateBase64Transaction(address),
          scope: FEATURED_NETWORKS['Solana Mainnet'],
        },
      };
    case 'signAllTransactions':
      return {
        params: {
          account: { address },
          transactions: [
            generateBase64Transaction(address),
            generateBase64Transaction(address),
          ],
          scope: FEATURED_NETWORKS['Solana Mainnet'],
        },
      };
    case 'signAndSendTransaction':
      return {
        params: {
          account: { address },
          transaction: generateBase64Transaction(address),
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
    default:
      return {};
  }
};
