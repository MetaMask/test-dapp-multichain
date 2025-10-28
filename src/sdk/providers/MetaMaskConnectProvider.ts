import type { MultichainCore, Scope } from '@metamask/connect-multichain';
import { createMetamaskConnect } from '@metamask/connect-multichain';

import type { Provider } from './Provider';
import { CaipAccountId } from '@metamask/utils';

type NotificationCallback = (notification: any) => void;

class MetaMaskConnectProvider implements Provider {
  #mmConnect: MultichainCore | null = null;
  #notificationCallbacks: Set<NotificationCallback> = new Set();
  #currnetSession: unknown = {"sessionScopes": {}};

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
            this.#currnetSession = notification.params;
          }
          this.#notifyCallbacks(notification);
        },
      },
      ui: {
        preferDesktop: false,
        preferExtension: false,
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
      return this.#currnetSession;
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
        const {accounts} = scopeObject as { accounts: CaipAccountId[] };
        accounts.forEach(requestedAccounts.add)
      });
      await this.#mmConnect?.connect(requestedScopes, Array.from(requestedAccounts));
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
