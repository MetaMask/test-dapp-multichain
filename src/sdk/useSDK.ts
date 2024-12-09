import type { CaipChainId } from '@metamask/utils';
import { useEffect, useState } from 'react';

import SDK from './SDK';

type UseSDKReturn = {
  sdk: SDK | undefined;
  isConnected: boolean;
  currentSession: any;
  connect: (extensionId: string) => void;
  disconnect: () => void;
  createSession: (scopes: CaipChainId[]) => Promise<any>;
  getSession: () => Promise<any>;
  revokeSession: () => Promise<any>;
  onSessionChanged: (callback: (notification: any) => void) => void;
  onNotification: (callback: (notification: any) => void) => void;
  extensionId: string;
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
        setExtensionId(storedExtensionId);
        console.log('connected', storedExtensionId);
        setIsConnected(true);
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

  const connect = (_extensionId: string) => {
    if (sdk) {
      try {
        const connected = sdk.setExtensionIdAndConnect(_extensionId);
        setIsConnected(connected);
        if (connected) {
          localStorage.setItem('extensionId', _extensionId);
        }
      } catch (error) {
        setIsConnected(false);
        throw error;
      }
    }
  };

  const disconnect = () => {
    if (sdk) {
      sdk.disconnect();
      setIsConnected(false);
      setCurrentSession(null);
      localStorage.removeItem('extensionId');
    }
  };

  const createSession = async (scopes: CaipChainId[]) => {
    if (!sdk) {
      throw new Error('SDK not initialized');
    }
    const result = await sdk.createSession(scopes);
    setCurrentSession(result);
    return result;
  };

  const getSession = async () => {
    if (!sdk) {
      throw new Error('SDK not initialized');
    }
    const result = await sdk.getSession();
    setCurrentSession(result);
    return result;
  };

  const revokeSession = async () => {
    if (!sdk) {
      throw new Error('SDK not initialized');
    }
    const result = await sdk.revokeSession();
    setCurrentSession(null);
    return result;
  };

  const onSessionChanged = (callback: (notification: any) => void) => {
    if (!sdk) {
      throw new Error('SDK not initialized');
    }
    sdk.onNotification((notification: any) => {
      if (notification.method === 'wallet_sessionChanged') {
        callback(notification);
      }
    });
  };

  const onNotification = (callback: (notification: any) => void) => {
    if (!sdk) {
      throw new Error('SDK not initialized');
    }
    sdk.onNotification(callback);
  };

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
  };
}
