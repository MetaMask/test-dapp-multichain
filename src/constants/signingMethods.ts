// Static mapping of known signing methods to their parameter paths
export const SIGNING_METHODS = {
  eth_sign: {
    path: ['params', 0, 'from'],
  },
  eth_signTypedData: {
    path: ['params', 0, 'from'],
  },
  eth_signTypedData_v3: {
    path: ['params', 0, 'from'],
  },
  eth_signTypedData_v4: {
    path: ['params', 0, 'from'],
  },
  eth_sendTransaction: {
    path: ['params', 0, 'from'],
  },
  eth_personalSign: {
    path: ['params', 0, 'from'],
  },
  personal_sign: {
    path: ['params', 0, 'from'],
  },
} as const;

type SigningMethod = keyof typeof SIGNING_METHODS;
type PathElement = string | number;

type JsonObject = {
  [key: string]: JsonValue;
};

type JsonArray = JsonValue[];

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;

export function insertSigningAddress(
  method: string,
  example: JsonValue,
  selectedAddress: string,
): JsonValue {
  // If not a signing method, return example unchanged
  if (!(method in SIGNING_METHODS)) {
    return example;
  }

  const updatedExample = JSON.parse(JSON.stringify(example));

  const { path } = SIGNING_METHODS[method as SigningMethod];

  let current: JsonValue = updatedExample;

  // Handle all but the last element in the path
  path.slice(0, -1).forEach((key: PathElement, index: number) => {
    if (typeof current !== 'object' || current === null) {
      current = typeof key === 'number' ? [] : {};
    }

    if (Array.isArray(current) && typeof key === 'number') {
      if (!(key in current)) {
        current[key] = index === path.length - 2 ? {} : [];
      }
    } else if (!Array.isArray(current) && typeof key === 'number') {
      current = [{}];
    } else if (!Array.isArray(current)) {
      if (!(key in current)) {
        current[key as string] = index === path.length - 2 ? {} : [];
      }
    }

    current = (current as any)[key];
  });

  const lastKey = path[path.length - 1];

  // Strip the chain ID prefix if the address includes it
  const cleanAddress = selectedAddress.includes(':')
    ? selectedAddress.split(':').pop()
    : selectedAddress;

  if (typeof current === 'object' && current !== null) {
    // @ts-expect-error - TODO: fix this
    current[lastKey] = cleanAddress;
  }

  return updatedExample;
}
