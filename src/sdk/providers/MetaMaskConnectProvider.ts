import type { MultichainCore, Scope } from '@metamask/connect-multichain';
import { createMetamaskConnect } from '@metamask/connect-multichain';
import type { CaipAccountId } from '@metamask/utils';

import type { Provider } from './Provider';

type NotificationCallback = (notification: any) => void;

class MetaMaskConnectProvider implements Provider {
  #mmConnect: MultichainCore | null = null;

  #notificationCallbacks: Set<NotificationCallback> = new Set();

  #walletSession: unknown = { sessionScopes: {} };

  async connect(scopes?: Scope[]): Promise<boolean> {
    if (this.#mmConnect) {
      this.disconnect();
    }

    this.#mmConnect = await createMetamaskConnect({
      api: {
        supportedNetworks: {},
      },
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
        preferExtension: true,
      },
    });

    const scopesToUse =
      scopes && scopes.length > 0
        ? scopes
        : (['eip155:1'] as unknown as Scope[]);
    await this.#mmConnect?.connect(scopesToUse, []);

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
      throw new Error(
        'wallet_revokeSession is not supported via MetaMask Connect',
      );
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
