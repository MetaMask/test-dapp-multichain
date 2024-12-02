import { parseCaipAccountId } from '@metamask/utils';
import type { Json } from '@metamask/utils';

// TODO need to inject chainId into eth_signTypedData_v4 example
export const SIGNING_METHODS = {
  eth_signTypedData_v4: {
    path: ['params', 0],
  },
  eth_sendTransaction: {
    path: ['params', 0, 'from'],
  },
  personal_sign: {
    path: ['params', 1],
  },
} as const;

type SigningMethod = keyof typeof SIGNING_METHODS;

export function insertSigningAddress(
  method: string,
  example: Json,
  selectedAddress: `${string}:${string}:${string}`,
): Json {
  if (!(method in SIGNING_METHODS)) {
    return example;
  }

  const updatedExample = JSON.parse(JSON.stringify(example));
  const { path } = SIGNING_METHODS[method as SigningMethod];

  let current: Json = updatedExample;

  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];

    if (typeof current !== 'object' || current === null) {
      current = typeof path[i + 1] === 'number' ? [] : {};
      continue;
    }

    if (key === undefined) {
      throw new Error('Undefined key encountered in path');
    }

    if (typeof key === 'number') {
      if (!Array.isArray(current)) {
        current = [];
      }
      if (!(key in current)) {
        current[key] = typeof path[i + 1] === 'number' ? [] : {};
      }
    } else {
      if (Array.isArray(current)) {
        continue;
      }
      if (!(key in current)) {
        current[key] = typeof path[i + 1] === 'number' ? [] : {};
      }
    }
  }

  const { address } = parseCaipAccountId(selectedAddress);

  const lastKey = path[path.length - 1];
  if (typeof current === 'object' && current !== null) {
    if (Array.isArray(current)) {
      current[lastKey as number] = address;
    } else {
      current[lastKey as string] = address;
    }
  }

  return updatedExample;
}
