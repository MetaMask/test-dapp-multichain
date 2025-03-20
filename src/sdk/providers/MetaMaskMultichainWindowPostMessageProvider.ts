import ObjectMultiplex from '@metamask/object-multiplex';
import { WindowPostMessageStream } from '@metamask/post-message-stream';
import type { Json, JsonRpcRequest, JsonRpcResponse } from '@metamask/utils';
import { assertIsJsonRpcResponse, isObject } from '@metamask/utils';
import type { Duplex, DuplexOptions } from 'readable-stream';
import { pipeline } from 'readable-stream';

import MetaMaskMultichainBaseProvider from './MetaMaskMultichainBaseProvider';

// contexts
const CONTENT_SCRIPT = 'metamask-contentscript';
const INPAGE = 'metamask-inpage';
const MULTICHAIN_SUBSTREAM_NAME = 'metamask-multichain-provider';

class MetaMaskMultichainWindowPostMessageProvider extends MetaMaskMultichainBaseProvider {
  #stream: Duplex | null;

  constructor() {
    super();
    this.#stream = null;
  }

  async connect(): Promise<boolean> {
    if (this.#stream) {
      this.disconnect();
    }

    const metamaskStream = new WindowPostMessageStream({
      name: INPAGE,
      target: CONTENT_SCRIPT,
    });

    const mux = new ObjectMultiplex(metamaskStream as DuplexOptions);
    this.#stream = mux.createStream(MULTICHAIN_SUBSTREAM_NAME);

    pipeline(mux, metamaskStream, mux, (error) => {
      this.#stream = null;
      console.error('Error connecting to extension:', error);
      this.disconnect();
    });

    // Wait for the next tick to allow onDisconnect to fire if there's an error
    // This is an unfortunate hack required to ensure the port is connected before
    // we declare the connection successful.
    // This gives a few ticks for the onDisconnect listener to fire if the runtime
    // connection fails because the extension for the given extensionId is not present.
    await new Promise((resolve) => setTimeout(resolve, 5));

    if (!this.isConnected()) {
      console.error(
        'Error connecting to MetaMask Multichain Provider. Make sure the Multichain Enable MetaMask extension is installed and enabled.',
      );
      return false;
    }

    this.#stream.on('data', this._handleMessage.bind(this));

    try {
      this.#stream.write('ping');
      console.log(
        'Connected to MetaMask Multichain Provider via window.postMessage',
      );
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  _disconnect(): void {
    if (this.#stream) {
      this.#stream.destroy();
      this.#stream = null;
    }
  }

  isConnected(): boolean {
    return Boolean(this.#stream);
  }

  _sendRequest(request: JsonRpcRequest) {
    this.#stream?.write({ type: 'caip-x', data: request });
  }

  _parseMessage(message: Json): JsonRpcResponse {
    const data = isObject(message) ? message.data : null;
    assertIsJsonRpcResponse(data);
    return data;
  }
}

export default MetaMaskMultichainWindowPostMessageProvider;
