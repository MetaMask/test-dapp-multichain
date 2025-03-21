import type { CaipChainId, Json } from '@metamask/utils';
import { parseCaipChainId, KnownCaipNamespace } from '@metamask/utils';

import { Eip155Notifications, Eip155Methods } from '../constants/methods';
import { getCaip25FormattedAddresses } from '../helpers/AddressHelpers';
import type MetaMaskMultichainBaseProvider from './providers/MetaMaskMultichainBaseProvider';
import MetaMaskMultichainExternallyConnectableProvider from './providers/MetaMaskMultichainExternallyConnectableProvider';
import MetaMaskMultichainWindowPostMessageProvider from './providers/MetaMaskMultichainWindowPostMessageProvider';

export const WINDOW_POST_MESSAGE_ID = 'window.postMessage';
export const METAMASK_PROD_CHROME_ID = 'nkbihfbeogaeaoehlefnkodbefgpgknn';

export class SDK {
  #provider: MetaMaskMultichainBaseProvider | null;

  constructor() {
    this.#provider = null;
  }

  public async createSession(
    scopes: CaipChainId[],
    addresses: string[],
  ): Promise<Json> {
    const optionalScopes = scopes.reduce<
      Record<
        CaipChainId,
        { methods: string[]; notifications: string[]; accounts: string[] }
      >
    >((acc, scope) => {
      const { reference, namespace } = parseCaipChainId(scope);
      // if this is an EVM chain, prepopulate the createSession request all the EIP155 methods and notifications that we support
      if (namespace === KnownCaipNamespace.Eip155 && reference !== undefined) {
        acc[scope] = {
          methods: Eip155Methods,
          notifications: Eip155Notifications,
          accounts: getCaip25FormattedAddresses(scope, addresses),
        };
      } else if (namespace === KnownCaipNamespace.Solana) {
        // TODO: add solana methods and notifications that our Solana snap supports
        // acc[scope] = {
        //   methods: SolanaMethods,
        //   notifications: SolanaNotifications,
        //   accounts: SolanaAccounts,
        // };
      } else if (namespace === KnownCaipNamespace.Bip122) {
        // TODO: add bip122 methods and notifications that our Bitcoin snap supports
        // acc[scope] = {
        //   methods: Bip122Methods,
        //   notifications: Bip122Notifications,
        //   accounts: Bip122Accounts,
        // };
      } else {
        // Any other chains we don't know the API for beforehand,
        acc[scope] = {
          methods: [],
          notifications: [],
          accounts: [],
        };
      }
      return acc;
    }, {});

    return this.#provider?.request({
      method: 'wallet_createSession',
      params: { optionalScopes },
    });
  }

  public async invokeMethod(options: {
    scope: CaipChainId;
    request: {
      method: string;
      params: Json[];
    };
  }): Promise<Json> {
    const { scope, request } = options;
    return this.#provider?.request({
      method: 'wallet_invokeMethod',
      params: {
        scope,
        request,
      },
    });
  }

  public async revokeSession(): Promise<Json> {
    return this.#provider?.request({
      method: 'wallet_revokeSession',
      params: [],
    });
  }

  public async getSession(): Promise<{
    sessionScopes: Record<
      CaipChainId,
      { methods: string[]; notifications: string[] }
    >;
  } | null> {
    return this.#provider?.request({
      method: 'wallet_getSession',
      params: [],
    });
  }

  public onNotification(listener: (notification: Json) => void): void {
    this.#provider?.onNotification(listener);
  }

  public disconnect(): void {
    this.#provider?.disconnect();
  }

  public async setExtensionIdAndConnect(extensionId: string): Promise<boolean> {
    // TODO add logic once we have CAIP-294 wallet discovery + or hardcode the stable extensionId
    let connected;
    if (extensionId === WINDOW_POST_MESSAGE_ID) {
      this.#provider = new MetaMaskMultichainWindowPostMessageProvider();
      connected = await this.#provider.connect();
    } else {
      this.#provider = new MetaMaskMultichainExternallyConnectableProvider();
      connected = await this.#provider.connect(extensionId);
    }

    return connected;
  }
}
