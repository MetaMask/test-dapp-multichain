import { parseCaipAccountId, parseCaipChainId } from '@metamask/utils';
import type { Json } from '@metamask/utils';

export const SIGNING_METHODS = {
  eth_sendTransaction: true,
  eth_signTypedData_v4: true,
  personal_sign: true,
} as const;

export const insertSigningAddress = (
  method: string,
  exampleParams: Json,
  address: `${string}:${string}:${string}`,
  scope: `${string}:${string}`,
): Json => {
  const { address: parsedAddress } = parseCaipAccountId(address);
  const { reference: chainId } = parseCaipChainId(scope);

  if (
    typeof exampleParams !== 'object' ||
    exampleParams === null ||
    !('method' in exampleParams) ||
    !('params' in exampleParams) ||
    !Array.isArray(exampleParams.params)
  ) {
    return exampleParams;
  }

  switch (method) {
    case 'eth_sendTransaction':
      if (
        exampleParams.params.length > 0 &&
        typeof exampleParams.params[0] === 'object' &&
        exampleParams.params[0] !== null
      ) {
        return {
          ...exampleParams,
          params: [
            {
              ...exampleParams.params[0],
              from: parsedAddress,
            },
            ...exampleParams.params.slice(1),
          ],
        };
      }
      break;

    case 'personal_sign':
      if (exampleParams.params.length >= 2) {
        return {
          ...exampleParams,
          params: [
            exampleParams.params[0],
            parsedAddress,
            ...exampleParams.params.slice(2),
          ] as Json[],
        };
      }
      break;

    case 'eth_signTypedData_v4':
      if (
        exampleParams.params.length >= 2 &&
        typeof exampleParams.params[1] === 'object' &&
        exampleParams.params[1] !== null
      ) {
        const typedData = exampleParams.params[1];
        if (
          typeof typedData === 'object' &&
          typedData !== null &&
          'domain' in typedData &&
          typeof typedData.domain === 'object' &&
          typedData.domain !== null
        ) {
          return {
            ...exampleParams,
            params: [
              parsedAddress,
              {
                ...typedData,
                domain: {
                  ...typedData.domain,
                  chainId,
                },
              },
            ],
          };
        }
      }
      break;

    default:
      break;
  }

  return exampleParams;
};
