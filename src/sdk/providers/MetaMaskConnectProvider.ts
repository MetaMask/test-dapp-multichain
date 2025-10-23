import type { JsonRpcRequest } from '@metamask/utils';

import { Provider } from './Provider';

type NotificationCallback = (notification: any) => void;

class MetaMaskConnectProvider implements Provider {
  #mmConnect: MetamaskConnect | null;
  #notificationCallbacks: Set<NotificationCallback> = new Set();

  constructor() {
    this.#mmConnect = null;
    this.#notificationCallbacks = new Set();
  }

  async connect(): Promise<boolean> {
    if (this.#mmConnect) {
      this.disconnect();
    }

    await createMetamaskConnect({
      dapp: {
        name: 'MultichainTest Dapp',
        url: 'https://metamask.github.io/test-dapp-multichain/latest/',
      },
      onNotification: (notification: any) => {
        this.#notifyCallbacks(notification);
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

  async request(request: JsonRpcRequest): Promise<any> {
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
      // unsure
    }
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
