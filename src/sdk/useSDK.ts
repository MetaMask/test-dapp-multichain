import type { CaipChainId, Json } from '@metamask/utils';
import { useCallback, useEffect, useState } from 'react';

import { SDK, METAMASK_PROD_CHROME_ID } from './SDK';

type UseSDKReturn = {
  isConnected: boolean;
  currentSession: any;
  extensionId: string;
  connect: (extensionId: string) => Promise<void>;
  disconnect: () => void;
  createSession: (scopes: CaipChainId[]) => Promise<Json>;
  getSession: () => Promise<Json>;
  revokeSession: () => Promise<Json>;
  invokeMethod: (
    scope: CaipChainId,
    request: { method: string; params: Json[] },
  ) => Promise<Json>;
  onNotification: (callback: (notification: any) => void) => void;
};

export function useSDK({
  onSessionChanged,
  onWalletNotify,
  onWalletAnnounce,
}: {
  onSessionChanged: (notification: any) => void;
  onWalletNotify: (callback: (notification: any) => void) => void;
  onWalletAnnounce: (ev: Event) => void;
}): UseSDKReturn {
  const [sdk, setSdk] = useState<SDK>();
  const [isConnected, setIsConnected] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [extensionId, setExtensionId] = useState<string>(
    METAMASK_PROD_CHROME_ID, // default to prod chrome extension id
  );

  /**
   * setup caip294:wallet_announce event listener
   * docs: https://github.com/ChainAgnostic/CAIPs/blob/bc4942857a8e04593ed92f7dc66653577a1c4435/CAIPs/caip-294.md#specification
   */
  useEffect(() => {
    window.addEventListener('caip294:wallet_announce', onWalletAnnounce);

    window.dispatchEvent(
      new CustomEvent('caip294:wallet_prompt', {
        detail: {
          id: 1,
          jsonrpc: '2.0',
          method: 'wallet_prompt',
          params: {},
        },
      }),
    );

    return () => {
      window.removeEventListener('caip294:wallet_announce', onWalletAnnounce);
    };
  }, [onWalletAnnounce]);

  useEffect(() => {
    if (sdk) {
      sdk.onNotification((notification: any) => {
        if (notification.method === 'wallet_sessionChanged') {
          setCurrentSession(notification.params);
          onSessionChanged(notification);
        }
      });
      sdk.onNotification((notification: any) => {
        if (notification.method === 'wallet_notify') {
          onWalletNotify(notification);
        }
      });
    }
  }, [sdk, onWalletNotify, onSessionChanged, setCurrentSession]);

  // Initialize SDK
  useEffect(() => {
    const newSdk = new SDK();
    setSdk(newSdk);

    return () => {
      newSdk.disconnect();
    };
  }, []);

  // Auto-connect with stored extension ID
  useEffect(() => {
    const autoConnect = async () => {
      const storedExtensionId = localStorage.getItem('extensionId');
      if (storedExtensionId && sdk) {
        try {
          const connectionSuccess = await sdk.setExtensionIdAndConnect(
            storedExtensionId,
          );
          setIsConnected(connectionSuccess);
          if (connectionSuccess) {
            setExtensionId(storedExtensionId);
          } else {
            console.error('Error auto-connecting');
          }
        } catch (error) {
          console.error('Error auto-connecting:', error);
          setIsConnected(false);
        }
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    autoConnect();
  }, [sdk]);

  // Check for existing session when connected
  useEffect(() => {
    const checkExistingSession = async () => {
      if (sdk && isConnected) {
        try {
          const result = await sdk.getSession();
          if (result) {
            setCurrentSession(result);
          }
        } catch (error) {
          console.error('Error checking existing session:', error);
        }
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    checkExistingSession();
  }, [sdk, isConnected]);

  const connect = useCallback(
    async (newExtensionId: string) => {
      if (sdk) {
        try {
          const connected = await sdk.setExtensionIdAndConnect(newExtensionId);
          setIsConnected(connected);
          if (connected) {
            localStorage.setItem('extensionId', newExtensionId);
            setExtensionId(newExtensionId);
          }
        } catch (error) {
          setIsConnected(false);
          throw error;
        }
      }
    },
    [sdk],
  );

  const disconnect = useCallback(() => {
    if (sdk) {
      sdk.disconnect();
      setIsConnected(false);
      setCurrentSession(null);
      localStorage.removeItem('extensionId');
      setExtensionId('');
    }
  }, [sdk]);

  const createSession = useCallback(
    async (scopes: CaipChainId[]) => {
      if (!sdk) {
        throw new Error('SDK not initialized');
      }
      const result = await sdk.createSession(scopes);
      console.log('result', result);
      setCurrentSession(result);
      return result;
    },
    [sdk],
  );

  const getSession = useCallback(async () => {
    if (!sdk) {
      throw new Error('SDK not initialized');
    }
    const result = await sdk.getSession();
    setCurrentSession(result);
    return result;
  }, [sdk]);

  const revokeSession = useCallback(async () => {
    if (!sdk) {
      throw new Error('SDK not initialized');
    }
    const result = await sdk.revokeSession();
    setCurrentSession(null);
    return result;
  }, [sdk]);

  const onNotification = useCallback(
    (callback: (notification: any) => void) => {
      if (!sdk) {
        throw new Error('SDK not initialized');
      }
      sdk.onNotification(callback);
    },
    [sdk],
  );

  const invokeMethod = useCallback(
    async (scope: CaipChainId, request: { method: string; params: Json[] }) => {
      if (!sdk) {
        throw new Error('SDK not initialized');
      }
      return sdk.invokeMethod({ scope, request });
    },
    [sdk],
  );

  return {
    isConnected,
    currentSession,
    extensionId,
    connect,
    disconnect,
    createSession,
    getSession,
    revokeSession,
    onNotification,
    invokeMethod,
  };
}
