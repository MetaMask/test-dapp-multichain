/* eslint-disable @typescript-eslint/no-misused-promises */
import React, { useEffect, useState } from 'react';

import './App.css';
import MetaMaskMultichainProvider from './providers/MetaMaskMultichainProvider';
import makeProvider from './providers/MockMultichainProvider';
import type { Provider } from './providers/Provider';

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
      'eip155:1': false,
    },
  );
  const [walletNotifyResults, setWalletNotifyResults] = useState<any>(null);
  const [walletSessionChangedResults, setWalletSessionChangedResults] =
    useState<any>(null);
  const [extensionId, setExtensionId] = useState<string>('');
  const [invokeMethodRequests, setInvokeMethodRequests] = useState<
    Record<string, string>
  >({});

  // Use useEffect to handle provider initialization and cleanup
  useEffect(() => {
    let newProvider: Provider;
    if (providerType === 'mock') {
      newProvider = makeProvider(() => createSessionResult);
    } else {
      newProvider = new MetaMaskMultichainProvider();
    }

    setProvider(newProvider);
  }, [providerType, createSessionResult]);

  // setup provider
  useEffect(() => {
    if (extensionId && provider) {
      provider.connect(extensionId);
      provider.onNotification((notification: any) => {
        if (notification.method === 'wallet_notify') {
          setWalletNotifyResults(notification);
        } else if (notification.method === 'wallet_sessionChanged') {
          setWalletSessionChangedResults(notification);
        }
      });
    }
    return () => {
      if (provider) {
        provider.disconnect();
      }
    };
  }, [extensionId, provider]);

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
        [scope]: { ...prev[scope], [method]: null },
      }));
    }
  };

  return (
    <div className="App">
      <h1>MetaMask MultiChain API Test Dapp</h1>
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
      <div>
        <h2>Session Lifecycle</h2>
        <br />
        <button onClick={handleResetState}>Clear State</button>
        <br />
        <div>
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
          <button onClick={handleCreateSession}>wallet_createSession</button>
        </div>
        {createSessionResult && (
          <div>
            <h2>Connected Scopes</h2>
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
                      const defaultRequest = {
                        method: 'wallet_invokeMethod',
                        params: {
                          scope,
                          request: { method: selectedMethod, params: [] },
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
                  <div>
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
                      style={{ width: '100%', maxWidth: '500px' }}
                    />
                  </div>
                  <button
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
                  {invokeMethodResults[scope] && (
                    <div>
                      <h4>Invoke Method Results:</h4>
                      {Object.entries(invokeMethodResults[scope]).map(
                        ([method, result]) => (
                          <div key={method}>
                            <h5>{method}:</h5>
                            <code className="code-left-align">
                              <pre>{JSON.stringify(result, null, 2)}</pre>
                            </code>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              ),
            )}
          </div>
        )}
        <div></div>
        <br />
        <br />
        <br />
        <button onClick={handleGetSession}>wallet_getSession</button>
        <div>
          <code className="code-left-align">
            <pre>{JSON.stringify(getSessionResult, null, 2)}</pre>
          </code>
        </div>
        <button onClick={handleRevokeSession}>wallet_revokeSession</button>
        <div>
          <code className="code-left-align">
            <pre>{JSON.stringify(revokeSessionResult, null, 2)}</pre>
          </code>
        </div>
        <br />
        <br />
        <br />
        <br />
        <h1>wallet_notify</h1>
        <code className="code-left-align">
          <pre>{JSON.stringify(walletNotifyResults, null, 4)}</pre>
        </code>
        <br />
        <br />
        <br />
        <br />
        <h1>wallet_sessionChanged</h1>
        <code className="code-left-align">
          <pre>{JSON.stringify(walletSessionChangedResults, null, 4)}</pre>
        </code>
        <br />
      </div>
    </div>
  );
}

export default App;
