// Buffer polyfill for browser environment
// if (typeof window !== 'undefined' && !window.Buffer) {
//   window.Buffer = {
//     from: (data: any, _encoding?: string) => {
//       if (typeof data === 'string') {
//         const encoder = new TextEncoder();
//         return encoder.encode(data);
//       }
//       return new Uint8Array(data);
//     },
//     alloc: (size: number) => new Uint8Array(size),
//     allocUnsafe: (size: number) => new Uint8Array(size),
//     isBuffer: (obj: any) => obj instanceof Uint8Array,
//   } as any;
// }

const generateBase64Transaction = (_address: string) => {
  // This is a mock transaction in base64 format - we're not actually using it on-chain
  // so we can use a static value that represents a valid transaction format
  const mockTransactionBase64 =
    'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDAgROw8oBzcUQJ3MAAAAAAAMCAgABDAIAAQwAAAAAAJnXk2sByMsAAAAAGGSF776IFi6/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAvQMAAAAAAAAAjEBiYVkSY3oXgvOs8iINDpa98gy8Q+E69vdmZjirciE7xBwmP4LHikKQZRLRjmJJrCJqVIup3YR6sUje0UYfcgsBAAAAAAAAAGQJa0ZXrO6tLjQ1XnnNJQgQI3cAAAAAAA==';

  return mockTransactionBase64;
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
          scope: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
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
          scope: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        },
      };
    case 'getBalance':
      return {
        params: {
          account: { address },
        },
      };
    case 'getAccountInfo':
      return {
        params: {
          account: { address },
        },
      };
    default:
      return {};
  }
};
