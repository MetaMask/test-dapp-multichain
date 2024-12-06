import MetaMaskOpenRPCDocument from '@metamask/api-specs';
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
              to: '0xE7d522230eFf653Bb0a9B4385F0be0815420Dd98', // safe recovery address in case funds are accidentally sent
              value: '0x0',
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

export const KnownWalletRpcMethods: string[] = [
  'wallet_registerOnboarding',
  'wallet_scanQRCode',
];

export const WalletEip155Methods = ['wallet_addEthereumChain'];

export const Eip155Notifications = ['eth_subscription'];

const Eip1193OnlyMethods = [
  'wallet_switchEthereumChain',
  'wallet_getPermissions',
  'wallet_requestPermissions',
  'wallet_revokePermissions',
  'eth_requestAccounts',
  'eth_accounts',
  'eth_coinbase',
  'net_version',
  'metamask_logWeb3ShimUsage',
  'metamask_getProviderState',
  'metamask_sendDomainMetadata',
  'wallet_registerOnboarding',
];

/**
 * All MetaMask methods, except for ones we have specified in the constants above.
 */
export const Eip155Methods = MetaMaskOpenRPCDocument.methods
  // eslint-disable-next-line @typescript-eslint/no-shadow
  .map(({ name }: { name: string }) => name)
  .filter((method: string) => !WalletEip155Methods.includes(method))
  .filter((method: string) => !KnownWalletRpcMethods.includes(method))
  .filter((method: string) => !Eip1193OnlyMethods.includes(method));
