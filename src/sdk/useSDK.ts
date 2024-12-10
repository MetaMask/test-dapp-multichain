import type { CaipChainId, Json } from '@metamask/utils';
import { useCallback, useEffect, useState } from 'react';

import SDK from './SDK';

type UseSDKReturn = {
  sdk: SDK | undefined;
  isConnected: boolean;
  currentSession: any;
  extensionId: string;
  connect: (extensionId: string) => void;
  disconnect: () => void;
  createSession: (scopes: CaipChainId[]) => Promise<Json>;
  getSession: () => Promise<Json>;
  revokeSession: () => Promise<Json>;
  invokeMethod: (
    scope: CaipChainId,
    request: { method: string; params: Json[] },
  ) => Promise<Json>;
  onSessionChanged: (callback: (notification: any) => void) => void;
  onNotification: (callback: (notification: any) => void) => void;
};

export function useSDK(): UseSDKReturn {
  const [sdk, setSdk] = useState<SDK>();
  const [isConnected, setIsConnected] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [extensionId, setExtensionId] = useState<string>('');

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
    const storedExtensionId = localStorage.getItem('extensionId');
    if (storedExtensionId && sdk) {
      try {
        sdk.setExtensionIdAndConnect(storedExtensionId);
        setIsConnected(true);
        setExtensionId(storedExtensionId);
      } catch (error) {
        console.error('Error auto-connecting:', error);
        setIsConnected(false);
      }
    }
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
    (newExtensionId: string) => {
      if (sdk) {
        try {
          const connected = sdk.setExtensionIdAndConnect(newExtensionId);
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

  const onSessionChanged = useCallback(
    (callback: (notification: any) => void) => {
      if (!sdk) {
        throw new Error('SDK not initialized');
      }
      sdk.onNotification((notification: any) => {
        if (notification.method === 'wallet_sessionChanged') {
          callback(notification);
        }
      });
    },
    [sdk],
  );

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
    sdk,
    isConnected,
    currentSession,
    extensionId,
    connect,
    disconnect,
    createSession,
    getSession,
    revokeSession,
    onSessionChanged,
    onNotification,
    invokeMethod,
  };
}
