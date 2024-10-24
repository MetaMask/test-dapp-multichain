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

  connect(extensionId: string): void {
    if (this.#port) {
      this.disconnect();
    }

    // eslint-disable-next-line
    this.#port = chrome.runtime.connect(extensionId);
    this.#port.onMessage.addListener(this.#handleMessage.bind(this));
    this.#port.onDisconnect.addListener(() => {
      this.#port = null;
      this.#requestMap.clear();
    });
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

      // Set a timeout for the request
      setTimeout(() => {
        if (this.#requestMap.has(_id)) {
          this.#requestMap.delete(_id);
          reject(new Error('Request timeout'));
        }
      }, 30000); // 30 seconds timeout
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
