import type { MethodObject } from '@open-rpc/meta-schema';

// Static mapping of known signing methods to their parameter paths
export const SIGNING_METHODS = {
  eth_sign: {
    path: ['from'],
  },
  eth_signTypedData: {
    path: ['from'],
  },
  eth_signTypedData_v3: {
    path: ['from'],
  },
  eth_signTypedData_v4: {
    path: ['from'],
  },
  eth_sendTransaction: {
    path: ['transaction', 'from'],
  },
  eth_personalSign: {
    path: ['from'],
  },
  personal_sign: {
    path: ['from'],
  },
} as const;

type SigningMethod = keyof typeof SIGNING_METHODS;

/**
 * Updates the request example with the selected address for signing methods
 * @param method The RPC method name
 * @param example The example request object from OpenRPC
 * @param selectedAddress The user's selected address
 * @returns The updated example with the signing address inserted
 */
export function insertSigningAddress(
  method: string,
  example: MethodObject['examples'][0]['params'],
  selectedAddress: string,
): any {
  // If not a signing method, return example unchanged
  if (!(method in SIGNING_METHODS)) {
    return example;
  }

  // Deep clone the example to avoid mutations
  const updatedExample = JSON.parse(JSON.stringify(example));

  // Get the path for this signing method
  const { path } = SIGNING_METHODS[method as SigningMethod];

  // Navigate to the correct location and insert the address
  let current = updatedExample;
  for (let i = 0; i < path.length - 1; i++) {
    if (!current[path[i]]) {
      current[path[i]] = {};
    }
    current = current[path[i]];
  }
  current[path[path.length - 1]] = selectedAddress;

  return updatedExample;
}
