import type {
  Json,
  JsonRpcId,
  JsonRpcRequest,
  JsonRpcResponse,
} from '@metamask/utils';
import { isJsonRpcSuccess } from '@metamask/utils';

import type { Provider } from './Provider';

type NotificationCallback = (notification: any) => void;

abstract class MetaMaskMultichainBaseProvider implements Provider {
  #requestMap: Map<
    JsonRpcId,
    { resolve: (value: unknown) => void; reject: (reason?: any) => void }
  >;

  #nextId = 1;

  #notificationCallbacks: Set<NotificationCallback> = new Set();

  constructor() {
    this.#requestMap = new Map();
    this.#nextId = 1;
    this.#notificationCallbacks = new Set();
  }

  abstract connect(...args: any): Promise<boolean>;

  abstract _disconnect(): void;

  abstract isConnected(): boolean;

  abstract _sendRequest(request: JsonRpcRequest): void;

  abstract _parseMessage(message: Json): JsonRpcResponse<Json>;

  disconnect(): void {
    this._disconnect();
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
    if (!this.isConnected()) {
      throw new Error('Not connected to any extension. Call connect() first.');
    }

    const _id = id ?? this.#nextId;
    this.#nextId += 1;
    const request = {
      jsonrpc: '2.0' as const,
      id: _id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.#requestMap.set(_id, { resolve, reject });
      this._sendRequest(request);
      setTimeout(() => {
        if (this.#requestMap.has(_id)) {
          this.#requestMap.delete(_id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  protected _handleMessage(message: any): void {
    const response = this._parseMessage(message);
    if (response.id && this.#requestMap.has(response.id)) {
      const { resolve, reject } = this.#requestMap.get(response.id) ?? {};
      this.#requestMap.delete(response.id);

      if (resolve && reject) {
        if (isJsonRpcSuccess(response)) {
          resolve(response.result);
        } else {
          reject(new Error(response.error.message));
        }
      }
    } else if (!response.id) {
      // It's a notification
      this.#notifyCallbacks(response);
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

export default MetaMaskMultichainBaseProvider;
