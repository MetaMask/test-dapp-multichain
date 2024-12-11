import type { Provider } from './Provider';

type NotificationCallback = (notification: any) => void;

class MetaMaskMultichainProvider implements Provider {
  #port: chrome.runtime.Port | null;

  #requestMap: Map<
    number,
    { resolve: (value: unknown) => void; reject: (reason?: any) => void }
  >;

  #nextId = 1;

  #notificationCallbacks: Set<NotificationCallback> = new Set();

  constructor() {
    this.#port = null;
    this.#requestMap = new Map();
    this.#nextId = 1;
    this.#notificationCallbacks = new Set();
  }

  async connect(extensionId: string): Promise<boolean> {
    if (this.#port) {
      this.disconnect();
    }

    this.#port = chrome.runtime.connect(extensionId);

    let isConnected = true;

    this.#port.onDisconnect.addListener(() => {
      isConnected = false;
      const errorMessage = chrome.runtime.lastError
        ? chrome.runtime.lastError.message
        : 'Port disconnected unexpectedly.';
      console.error('Error connecting to extension:', errorMessage);
      this.#port = null;
      this.#requestMap.clear();
    });

    // Wait for the next tick to allow onDisconnect to fire if there's an error
    // This is an unfortunate hack required to ensure the port is connected before
    // we declare the connection successful.
    // This gives a few ticks for the onDisconnect listener to fire if the runtime
    // connection fails because the extension for the given extensionId is not present.
    await new Promise((resolve) => setTimeout(resolve, 5));

    if (!isConnected) {
      console.error(
        'Error connecting to MetaMask Multichain Provider. Make sure the Multichain Enable MetaMask extension is installed and enabled.',
      );
      return false;
    }

    this.#port.onMessage.addListener(this.#handleMessage.bind(this));

    try {
      this.#port.postMessage('ping');
      console.log('Connected to MetaMask Multichain Provider');
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  disconnect(): void {
    if (this.#port) {
      this.#port.disconnect();
      this.#port = null;
    }
    this.#requestMap.clear();
    this.removeAllNotificationListeners();
  }

  async request({
    method,
    params,
    id,
  }: {
    method: string;
    params: any;
    id?: number;
  }): Promise<any> {
    if (!this.#port) {
      throw new Error('Not connected to any extension. Call connect() first.');
    }

    const _id = id ?? this.#nextId;
    this.#nextId += 1;
    const request = {
      jsonrpc: '2.0',
      id: _id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.#requestMap.set(_id, { resolve, reject });
      this.#port?.postMessage({ type: 'caip-x', data: request });
      setTimeout(() => {
        if (this.#requestMap.has(_id)) {
          this.#requestMap.delete(_id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  #handleMessage(message: any): void {
    const { data } = message;
    if (data.id && this.#requestMap.has(data.id)) {
      const { resolve, reject } = this.#requestMap.get(data.id) ?? {};
      this.#requestMap.delete(data.id);

      if (resolve && reject) {
        if (data.error) {
          reject(new Error(data.error.message));
        } else {
          resolve(data.result);
        }
      }
    } else if (!data.id) {
      // It's a notification
      this.#notifyCallbacks(data);
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

export default MetaMaskMultichainProvider;
