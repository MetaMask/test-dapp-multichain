import type { MultichainCore, Scope } from '@metamask/connect-multichain';
import { createMetamaskConnect } from '@metamask/connect-multichain';
import type { CaipAccountId } from '@metamask/utils';

import type { Provider } from './Provider';

type NotificationCallback = (notification: any) => void;

class MetaMaskConnectProvider implements Provider {
  #mmConnect: MultichainCore | null = null;

  #notificationCallbacks: Set<NotificationCallback> = new Set();

  #walletSession: unknown = { sessionScopes: {} };

  async connect(): Promise<boolean> {
    if (this.#mmConnect) {
      this.disconnect();
    }

    this.#mmConnect = await createMetamaskConnect({
      dapp: {
        name: 'MultichainTest Dapp',
        url: 'https://metamask.github.io/test-dapp-multichain/latest/',
      },
      transport: {
        onNotification: (notification: any) => {
          if (notification.method === 'wallet_sessionChanged') {
            this.#walletSession = notification.params;
          }
          this.#notifyCallbacks(notification);
        },
      },
      ui: {
        preferDesktop: false,
        preferExtension: false,
      },
      api: {
        readonlyRPCMap: {
          // Ethereum Mainnet
          'eip155:1': `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_PROJECT_ID}`,
          // Linea Mainnet
          'eip155:59144': `https://linea-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_PROJECT_ID}`,
          // Arbitrum One
          'eip155:42161': `https://arbitrum-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_PROJECT_ID}`,
          // Avalanche C-Chain
          'eip155:43114': `https://avalanche-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_PROJECT_ID}`,
          // BNB Chain
          'eip155:56': `https://bsc-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_PROJECT_ID}`,
          // Optimism Mainnet
          'eip155:10': `https://optimism-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_PROJECT_ID}`,
          // Polygon Mainnet
          'eip155:137': `https://polygon-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_PROJECT_ID}`,
          // zkSync Era Mainnet
          'eip155:324': `https://zksync-era-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_PROJECT_ID}`,
          // Base Mainnet
          'eip155:8453': `https://base-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_PROJECT_ID}`,
          // Localhost (for development)
          'eip155:1337': 'http://localhost:8545',
        },
      },
    });

    await this.#mmConnect?.connect(['eip155:1'], []);

    return true;
  }

  disconnect(): void {
    if (this.#mmConnect !== null) {
      this.#mmConnect.disconnect().catch(console.error);
      this.#mmConnect = null;
    }
  }

  isConnected(): boolean {
    return Boolean(this.#mmConnect);
  }

  async request(request: { method: string; params: any }): Promise<any> {
    if (request.method === 'wallet_invokeMethod') {
      return this.#mmConnect?.invokeMethod(request.params);
    }
    if (request.method === 'wallet_getSession') {
      return this.#walletSession;
    }
    if (request.method === 'wallet_revokeSession') {
      this.disconnect();
    }
    if (request.method === 'wallet_createSession') {
      const requestedScopes = Object.keys({
        ...request.params.optionalScopes,
        ...request.params.requiredScopes,
      }) as unknown as Scope[];

      const requestedAccounts = new Set<CaipAccountId>();
      Object.values(request.params.optionalScopes).forEach((scopeObject) => {
        const { accounts } = scopeObject as { accounts: CaipAccountId[] };
        accounts.forEach((account) => requestedAccounts.add(account));
      });
      await this.#mmConnect?.connect(
        requestedScopes,
        Array.from(requestedAccounts),
      );
      return this.#walletSession;
    }
    return Promise.resolve(null);
  }

  onNotification(callback: NotificationCallback): void {
    this.#notificationCallbacks.add(callback);
  }

  removeNotificationListener(callback: NotificationCallback): void {
    this.#notificationCallbacks.delete(callback);
  }

  removeAllNotificationListeners() {
    this.#notificationCallbacks.forEach(
      this.removeNotificationListener.bind(this),
    );
  }

  #notifyCallbacks(notification: any): void {
    this.#notificationCallbacks.forEach((callback) => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });
  }
}

export default MetaMaskConnectProvider;
