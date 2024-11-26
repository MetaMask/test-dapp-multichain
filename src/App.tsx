/* eslint-disable @typescript-eslint/no-misused-promises */
import { MetaMaskOpenRPCDocument } from '@metamask/api-specs';
import type { MethodObject, OpenrpcDocument } from '@open-rpc/meta-schema';
import { parseOpenRPCDocument } from '@open-rpc/schema-utils-js';
import throttle from 'lodash.throttle';
import React, { useCallback, useEffect, useState } from 'react';

import './App.css';
import { openRPCExampleToJSON } from './helpers/OpenRPCExampleToJSON';
import MetaMaskMultichainProvider from './providers/MetaMaskMultichainProvider';
import makeProvider from './providers/MockMultichainProvider';
import type { Provider } from './providers/Provider';

// Add this helper function at the top of your file, outside the App component
const truncateJSON = (json: any): string => {
  const stringified = JSON.stringify(json, null, 2);
  if (stringified.length <= 100) {
    return stringified;
  }
  return `${stringified.substring(0, 100)}...`;
};

function App() {
  const [createSessionResult, setCreateSessionResult] = useState<any>(null);
  const [providerType, setProviderType] = useState<string>('metamask');
  const [provider, setProvider] = useState<Provider>();
  const [getSessionResult, setGetSessionResult] = useState<any>(null);
  const [revokeSessionResult, setRevokeSessionResult] = useState<any>(null);
  const [selectedMethods, setSelectedMethods] = useState<
    Record<string, string>
  >({});
  const [invokeMethodResults, setInvokeMethodResults] = useState<
    Record<string, any>
  >({});
  const [customScope, setCustomScope] = useState<string>('');
  const [selectedScopes, setSelectedScopes] = useState<Record<string, boolean>>(
    {
      'eip155:1337': false,
      'eip155:1': true,
    },
  );
  const [walletNotifyResults, setWalletNotifyResults] = useState<any>(null);
  const [walletSessionChangedResults, setWalletSessionChangedResults] =
    useState<any>(null);
  const [extensionId, setExtensionId] = useState<string>('');
  const [invokeMethodRequests, setInvokeMethodRequests] = useState<
    Record<string, string>
  >({});
  const [metamaskOpenrpcDocument, setMetamaskOpenrpcDocument] =
    useState<OpenrpcDocument>();
  const [
    isExternallyConnectableConnected,
    setisExternallyConnectableConnected,
  ] = useState<boolean>(false);

  // Use useEffect to handle provider initialization and cleanup
  useEffect(() => {
    let newProvider: Provider;
    if (providerType === 'mock') {
      newProvider = makeProvider(() => createSessionResult);
    } else {
      console.log('creating metamask provider');
      newProvider = new MetaMaskMultichainProvider();
    }

    setProvider(newProvider);
  }, [providerType, createSessionResult]);

  // Define the throttled function using useCallback
  const throttledConnect = useCallback(
    throttle(
      () => {
        provider?.connect(extensionId);
      },
      500,
      { leading: false },
    ),
    [provider, extensionId], // Dependencies
  );

  useEffect(() => {
    const extensionIdFromLocalStorage = localStorage.getItem('extensionId');
    if (extensionIdFromLocalStorage) {
      setExtensionId(extensionIdFromLocalStorage);
    }
  }, []);

  // setup provider
  useEffect(() => {
    if (extensionId && provider) {
      try {
        throttledConnect();
        setisExternallyConnectableConnected(true);
        localStorage.setItem('extensionId', extensionId);
        provider.onNotification((notification: any) => {
          if (notification.method === 'wallet_notify') {
            setWalletNotifyResults(notification);
          } else if (notification.method === 'wallet_sessionChanged') {
            setWalletSessionChangedResults(notification);
          }
        });
      } catch (error) {
        setisExternallyConnectableConnected(false);
      }
    }
    return () => {
      if (provider) {
        provider.disconnect();
      }
    };
  }, [extensionId, provider]);

  useEffect(() => {
    parseOpenRPCDocument(MetaMaskOpenRPCDocument)
      .then((parsedOpenRPCDocument) => {
        setMetamaskOpenrpcDocument(parsedOpenRPCDocument);
      })
      .catch(() => {
        //
      });
  }, []);

  // Update the handleResetState function
  const handleResetState = () => {
    setCreateSessionResult(null);
    setGetSessionResult(null);
    setRevokeSessionResult(null);
    setSelectedMethods({});
    setInvokeMethodResults({});
    setCustomScope('');
    setWalletNotifyResults(null);
    setWalletSessionChangedResults(null);
    setSelectedScopes({
      'eip155:1337': false,
      'eip155:1': false,
    });
  };

  const handleCreateSession = async () => {
    try {
      const requiredScopes: Record<string, any> = {};

      Object.entries(selectedScopes).forEach(([scope, isSelected]) => {
        if (isSelected) {
          requiredScopes[scope] = {
            methods: ['eth_sendTransaction', 'eth_sign'],
            notifications: ['eth_subscription'],
          };
        }
      });

      if (customScope) {
        requiredScopes[customScope] = {
          methods: ['eth_sendTransaction', 'eth_sign'],
          notifications: ['eth_subscription'],
        };
      }

      const result = await provider?.request({
        method: 'wallet_createSession',
        params: { requiredScopes },
      });
      setCreateSessionResult(result);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleGetSession = async () => {
    try {
      const result = await provider?.request({
        method: 'wallet_getSession',
        params: [],
      });
      setGetSessionResult(result);
    } catch (error) {
      console.error('Error getting session:', error);
    }
  };

  const handleRevokeSession = async () => {
    try {
      const result = await provider?.request({
        method: 'wallet_revokeSession',
        params: [],
      });
      if (result) {
        setRevokeSessionResult(result);
        handleResetState();
      }
    } catch (error) {
      console.error('Error revoking session:', error);
    }
  };

  const handleInvokeMethod = async (scope: string, method: string) => {
    try {
      const requestObject = JSON.parse(invokeMethodRequests[scope] ?? '{}');
      const result = await provider?.request(requestObject);
      setInvokeMethodResults((prev) => ({
        ...prev,
        [scope]: { ...prev[scope], [method]: result },
      }));
    } catch (error) {
      console.error('Error invoking method:', error);
      setInvokeMethodResults((prev) => ({
        ...prev,
        [scope]: { ...prev[scope], [method]: error },
      }));
    }
  };

  const handleInvokeAllMethods = async () => {
    const scopesWithMethods = Object.entries(selectedMethods)
      .filter(([_, method]) => method) // Only include scopes that have a method selected
      .map(([scope, method]) => ({ scope, method }));

    // Invoke all methods in parallel
    await Promise.all(
      scopesWithMethods.map(async ({ scope, method }) =>
        handleInvokeMethod(scope, method),
      ),
    );
  };

  return (
    <div className="App">
      <h1>MetaMask MultiChain API Test Dapp</h1>
      <section>
        <div>
          <label>
            Provider:
            <select
              value={providerType}
              onChange={(evt) => setProviderType(evt.target.value)}
            >
              <option value="metamask">MetaMask Provider</option>
              <option value="mock">Mock Provider</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            Extension ID:
            <input
              type="text"
              placeholder="Enter extension ID"
              value={extensionId}
              onChange={(evt) => setExtensionId(evt.target.value)}
            />
          </label>
        </div>
        <div className="connection-status">
          <span
            className={`status-indicator ${
              isExternallyConnectableConnected
                ? 'status-connected'
                : 'status-disconnected'
            }`}
          ></span>
          <span>
            {isExternallyConnectableConnected
              ? 'Ready to Connect'
              : 'Not ready to connect'}
          </span>
          <button
            onClick={() => {
              setExtensionId('');
              setisExternallyConnectableConnected(false);
              localStorage.removeItem('extensionId');
            }}
          >
            Clear Extension ID
          </button>
        </div>
      </section>
      <section>
        <div>
          <h2>Session Lifecycle</h2>

          <div className="create-session-container">
            <h3>Create Session</h3>
            <label>
              <input
                type="checkbox"
                name="eip155:1337"
                checked={selectedScopes['eip155:1337']}
                onChange={(evt) =>
                  setSelectedScopes((prev) => ({
                    ...prev,
                    'eip155:1337': evt.target.checked,
                  }))
                }
              />{' '}
              EIP155:1337
            </label>
            <label>
              <input
                type="checkbox"
                name="eip155:1"
                checked={selectedScopes['eip155:1']}
                onChange={(evt) =>
                  setSelectedScopes((prev) => ({
                    ...prev,
                    'eip155:1': evt.target.checked,
                  }))
                }
              />{' '}
              EIP155:1
            </label>
            <div>
              <label>
                Custom:
                <input
                  type="text"
                  placeholder="e.g., eip155:5"
                  value={customScope}
                  onChange={(evt) => setCustomScope(evt.target.value)}
                />
              </label>
            </div>
            <button id="create-session-btn" onClick={handleCreateSession}>
              wallet_createSession
            </button>
          </div>

          <div className="session-divider" />

          <div className="session-controls">
            <button id="clear-state-btn" onClick={handleResetState}>
              Clear State
            </button>
            <button id="get-session-btn" onClick={handleGetSession}>
              wallet_getSession
            </button>
            <button id="revoke-session-btn" onClick={handleRevokeSession}>
              wallet_revokeSession
            </button>
          </div>

          <div className="session-result">
            {(createSessionResult ||
              getSessionResult ||
              revokeSessionResult) && (
              <>
                {createSessionResult && (
                  <div className="result-item">
                    <h4>Create Session Result:</h4>
                    <details>
                      <summary className="result-summary">
                        {truncateJSON(createSessionResult)}
                      </summary>
                      <code className="code-left-align">
                        <pre id="create-session-result">
                          {JSON.stringify(createSessionResult, null, 2)}
                        </pre>
                      </code>
                    </details>
                  </div>
                )}
                {getSessionResult && (
                  <div className="result-item">
                    <h4>Get Session Result:</h4>
                    <details>
                      <summary className="result-summary">
                        {truncateJSON(getSessionResult)}
                      </summary>
                      <code className="code-left-align">
                        <pre id="get-session-result">
                          {JSON.stringify(getSessionResult, null, 2)}
                        </pre>
                      </code>
                    </details>
                  </div>
                )}
                {revokeSessionResult && (
                  <div className="result-item">
                    <h4>Revoke Session Result:</h4>
                    <details>
                      <summary className="result-summary">
                        {truncateJSON(revokeSessionResult)}
                      </summary>
                      <code className="code-left-align">
                        <pre id="revoke-session-result">
                          {JSON.stringify(revokeSessionResult, null, 2)}
                        </pre>
                      </code>
                    </details>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
      {createSessionResult?.sessionScopes && (
        <section>
          <div>
            <h2>Connected Scopes</h2>
            <button
              onClick={handleInvokeAllMethods}
              disabled={Object.keys(selectedMethods).length === 0}
              style={{ marginBottom: '1rem' }}
            >
              Invoke All Selected Methods
            </button>
            {Object.entries(createSessionResult.sessionScopes).map(
              ([scope, details]: [string, any]) => (
                <div key={scope}>
                  <h3>{scope}</h3>
                  <select
                    value={selectedMethods[scope] ?? ''}
                    onChange={(evt) => {
                      const selectedMethod = evt.target.value;
                      setSelectedMethods((prev) => ({
                        ...prev,
                        [scope]: selectedMethod,
                      }));
                      const example = metamaskOpenrpcDocument?.methods.find(
                        (method) => {
                          return (
                            (method as MethodObject).name === selectedMethod
                          );
                        },
                      );
                      const defaultRequest = {
                        method: 'wallet_invokeMethod',
                        params: {
                          scope,
                          request: openRPCExampleToJSON(
                            example as MethodObject,
                          ),
                        },
                      };
                      setInvokeMethodRequests((prev) => ({
                        ...prev,
                        [scope]: JSON.stringify(defaultRequest, null, 2),
                      }));
                    }}
                  >
                    <option value="">Select a method</option>
                    {details.methods.map((method: string) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                  <div className="method-container">
                    <h4>Invoke Method Request:</h4>
                    <textarea
                      value={invokeMethodRequests[scope] ?? ''}
                      onChange={(evt) =>
                        setInvokeMethodRequests((prev) => ({
                          ...prev,
                          [scope]: evt.target.value,
                        }))
                      }
                      rows={5}
                      cols={50}
                    />
                  </div>
                  <button
                    id={`invoke-method-${scope}-btn`}
                    onClick={async () => {
                      if (selectedMethods[scope]) {
                        await handleInvokeMethod(
                          scope,
                          selectedMethods[scope] ?? '',
                        );
                      }
                    }}
                  >
                    Invoke Method
                  </button>
                  <div className="method-result">
                    <h4>Invoke Method Results:</h4>
                    {Object.entries(invokeMethodResults?.[scope] ?? {}).map(
                      ([method, result]) => (
                        <div key={method}>
                          <h5>{method}:</h5>
                          <code className="code-left-align">
                            <pre id={`invoke-method-${scope}-${method}-result`}>
                              {JSON.stringify(result, null, 2)}
                            </pre>
                          </code>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        </section>
      )}
      <section className="notifications-section">
        <h2>Notifications</h2>
        <div className="notification-container">
          <h3>wallet_notify</h3>
          <code className="code-left-align">
            <pre id="wallet-notify-result">
              {JSON.stringify(walletNotifyResults, null, 2)}
            </pre>
          </code>
        </div>

        <div className="notification-container">
          <h3>wallet_sessionChanged</h3>
          <code className="code-left-align">
            <pre id="wallet-session-changed-result">
              {JSON.stringify(walletSessionChangedResults, null, 2)}
            </pre>
          </code>
        </div>
      </section>
    </div>
  );
}

export default App;
