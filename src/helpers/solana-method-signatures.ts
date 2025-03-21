import { Transaction, PublicKey, SystemProgram } from '@solana/web3.js';

const generateBase64Transaction = (address: string) => {
  const publicKey = new PublicKey(address);

  const transaction = new Transaction({
    feePayer: publicKey,
    recentBlockhash: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  }).add(
    SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: publicKey,
      lamports: 10,
    }),
  );

  const base64Transaction = Buffer.from(transaction.serialize()).toString(
    'base64',
  );
  return base64Transaction;
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
          message: 'SGVsbG8sIHdvcmxkIQ==', // `Hello, world!` in base64
        },
      };
    case 'signTransaction':
      return {
        params: {
          account: { address },
          transaction: generateBase64Transaction(address),
          scope: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        },
      };
    default:
      return {};
  }
};
