// Types for JSON values
export type JsonObject = {
  [key: string]: JsonValue;
};

export type JsonArray = JsonValue[];

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;

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
  example: JsonValue,
  selectedAddress: string,
): JsonValue {
  // If not a signing method, return example unchanged
  if (!(method in SIGNING_METHODS)) {
    return example;
  }

  const updatedExample = JSON.parse(JSON.stringify(example)) as JsonValue;
  const { path } = SIGNING_METHODS[method as SigningMethod];

  // @ts-expect-error - TODO: fix this
  let current: JsonObject | JsonArray = updatedExample;

  // Handle all but the last element in the path
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

    // @ts-expect-error - TODO: fix this
    current = current[key];
  }

  // Strip the chain ID prefix if the address includes it
  const cleanAddress = selectedAddress.includes(':')
    ? selectedAddress.split(':').pop() ?? selectedAddress
    : selectedAddress;

  const lastKey = path[path.length - 1];
  if (typeof current === 'object' && current !== null) {
    if (Array.isArray(current)) {
      current[lastKey as number] = cleanAddress;
    } else {
      current[lastKey as string] = cleanAddress;
    }
  }

  return updatedExample;
}
