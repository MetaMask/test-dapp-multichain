import type { MultichainCore } from '@metamask/connect-multichain';
import { createMetamaskConnect } from '@metamask/connect-multichain';

import type { Provider } from './Provider';

type NotificationCallback = (notification: any) => void;

class MetaMaskConnectProvider implements Provider {
  #mmConnect: MultichainCore | null;

  #notificationCallbacks: Set<NotificationCallback> = new Set();

  constructor() {
    this.#mmConnect = null;
    this.#notificationCallbacks = new Set();
  }

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
          this.#notifyCallbacks(notification);
        },
      },
    });


    return true;
  }

  disconnect(): void {
    if (this.#mmConnect !== null) {
      this.#mmConnect.disconnect();
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
      // handle this locally
    }
    if (request.method === 'wallet_revokeSession') {
      // noop?
    }
    if (request.method === 'wallet_createSession') {
      await this.#mmConnect?.connect(['eip155:1'], []);
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
