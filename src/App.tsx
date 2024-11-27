/* eslint-disable @typescript-eslint/no-misused-promises */
import { MetaMaskOpenRPCDocument } from '@metamask/api-specs';
import type { MethodObject, OpenrpcDocument } from '@open-rpc/meta-schema';
import { parseOpenRPCDocument } from '@open-rpc/schema-utils-js';
import React, { useEffect, useState } from 'react';

import './App.css';
import { openRPCExampleToJSON } from './helpers/OpenRPCExampleToJSON';
import MetaMaskMultichainProvider from './providers/MetaMaskMultichainProvider';
import makeProvider from './providers/MockMultichainProvider';
import type { Provider } from './providers/Provider';
import { insertSigningAddress } from './constants/signingMethods';

const truncateJSON = (
  json: any,
  maxLength = 100,
): { text: string; truncated: boolean } => {
  const stringified = JSON.stringify(json, null, 2);
  if (stringified.length <= maxLength) {
    return { text: stringified, truncated: false };
  }
  return {
    text: stringified,
    truncated: true,
  };
};

const FEATURED_NETWORKS = {
  'eip155:1': 'Ethereum Mainnet',
  'eip155:59144': 'Linea Mainnet',
  'eip155:42161': 'Arbitrum One',
  'eip155:43114': 'Avalanche Network C-Chain',
  'eip155:56': 'BNB Chain',
  'eip155:10': 'OP Mainnet',
  'eip155:137': 'Polygon Mainnet',
  'eip155:324': 'zkSync Era Mainnet',
  'eip155:8453': 'Base Mainnet',
} as const;

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
    Record<string, Record<string, any[]>>
  >({});
  const [customScope, setCustomScope] = useState<string>('');
  const [selectedScopes, setSelectedScopes] = useState<Record<string, boolean>>(
    {
      'eip155:1': false,
      'eip155:59144': false,
      'eip155:42161': false,
      'eip155:43114': false,
      'eip155:56': false,
      'eip155:10': false,
      'eip155:137': false,
      'eip155:324': false,
      'eip155:8453': false,
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
  const [isResultExpanded, setIsResultExpanded] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<
    Record<string, string>
  >({});

  const handleConnect = () => {
    if (extensionId && provider) {
      try {
        provider.connect(extensionId);
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
  };

  useEffect(() => {
    let newProvider: Provider;
    if (providerType === 'mock') {
      newProvider = makeProvider(() => createSessionResult);
    } else {
      console.log('creating metamask provider');
      newProvider = new MetaMaskMultichainProvider();
    }

    setProvider(newProvider);

    return () => {
      newProvider.disconnect();
    };
  }, [providerType]);

  useEffect(() => {
    const extensionIdFromLocalStorage = localStorage.getItem('extensionId');
    if (extensionIdFromLocalStorage && provider) {
      setExtensionId(extensionIdFromLocalStorage);
      try {
        provider.connect(extensionIdFromLocalStorage);
        setisExternallyConnectableConnected(true);
        provider.onNotification((notification: any) => {
          if (notification.method === 'wallet_notify') {
            setWalletNotifyResults(notification);
          } else if (notification.method === 'wallet_sessionChanged') {
            setWalletSessionChangedResults(notification);
          }
        });
      } catch (error) {
        console.error('Error auto-connecting:', error);
        setisExternallyConnectableConnected(false);
      }
    }
  }, [provider]);

  useEffect(() => {
    const checkExistingSession = async () => {
      if (provider && isExternallyConnectableConnected) {
        try {
          const result = await provider.request({
            method: 'wallet_getSession',
            params: [],
          });
          if (result) {
            setGetSessionResult(result);
            setCreateSessionResult(result);

            const initialSelectedMethods: Record<string, string> = {};
            Object.keys(result.sessionScopes).forEach((scope) => {
              initialSelectedMethods[scope] = 'eth_blockNumber';

              const example = metamaskOpenrpcDocument?.methods.find(
                (method) => (method as MethodObject).name === 'eth_blockNumber',
              );

              const defaultRequest = {
                method: 'wallet_invokeMethod',
                params: {
                  scope,
                  request: openRPCExampleToJSON(example as MethodObject),
                },
              };

              setInvokeMethodRequests((prev) => ({
                ...prev,
                [scope]: JSON.stringify(defaultRequest, null, 2),
              }));
            });
            setSelectedMethods(initialSelectedMethods);
          }
        } catch (error) {
          console.error('Error checking existing session:', error);
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    checkExistingSession();
  }, [provider, isExternallyConnectableConnected, metamaskOpenrpcDocument]);

  useEffect(() => {
    parseOpenRPCDocument(MetaMaskOpenRPCDocument)
      .then((parsedOpenRPCDocument) => {
        setMetamaskOpenrpcDocument(parsedOpenRPCDocument);
        console.log('parsedOpenRPCDocument', parsedOpenRPCDocument);
      })
      .catch(() => {
        //
      });
  }, []);

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
      'eip155:1': false,
      'eip155:59144': false,
      'eip155:42161': false,
      'eip155:43114': false,
      'eip155:56': false,
      'eip155:10': false,
      'eip155:137': false,
      'eip155:324': false,
      'eip155:8453': false,
    });
  };

  const handleCreateSession = async () => {
    try {
      const optionalScopes: Record<string, any> = {};

      Object.entries(selectedScopes).forEach(([scope, isSelected]) => {
        if (isSelected) {
          optionalScopes[scope] = {
            methods: ['eth_sendTransaction', 'eth_sign'],
            notifications: ['eth_subscription'],
          };
        }
      });

      if (customScope) {
        optionalScopes[customScope] = {
          methods: ['eth_sendTransaction', 'eth_sign'],
          notifications: ['eth_subscription'],
        };
      }

      console.log('optionalScopes', {
        method: 'wallet_createSession',
        params: { optionalScopes },
      });

      const result = await provider?.request({
        method: 'wallet_createSession',
        params: { optionalScopes },
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

      setInvokeMethodResults((prev) => {
        const scopeResults = prev[scope] ?? {};
        const methodResults = scopeResults[method] ?? [];
        return {
          ...prev,
          [scope]: {
            ...scopeResults,
            [method]: [...methodResults, result],
          },
        };
      });
    } catch (error) {
      setInvokeMethodResults((prev) => {
        const scopeResults = prev[scope] ?? {};
        const methodResults = scopeResults[method] ?? [];
        return {
          ...prev,
          [scope]: {
            ...scopeResults,
            [method]: [...methodResults, error],
          },
        };
      });
      console.error('Error invoking method:', error);
    }
  };

  const handleInvokeAllMethods = async () => {
    const scopesWithMethods = Object.entries(selectedMethods)
      .filter(([_, method]) => method) // Only include scopes that have a method selected
      .map(([scope, method]) => ({ scope, method }));

    await Promise.all(
      scopesWithMethods.map(async ({ scope, method }) =>
        handleInvokeMethod(scope, method),
      ),
    );
  };

  useEffect(() => {
    if (createSessionResult?.sessionScopes) {
      const initialSelectedMethods: Record<string, string> = {};
      const initialSelectedAccounts: Record<string, string> = {};

      Object.entries(createSessionResult.sessionScopes).forEach(
        ([scope, details]: [string, any]) => {
          // Initialize method selection
          initialSelectedMethods[scope] = 'eth_blockNumber';

          // Initialize account selection with first account
          if (details.accounts && details.accounts.length > 0) {
            initialSelectedAccounts[scope] = details.accounts[0];
          }

          const example = metamaskOpenrpcDocument?.methods.find(
            (method) => (method as MethodObject).name === 'eth_blockNumber',
          );

          const defaultRequest = {
            method: 'wallet_invokeMethod',
            params: {
              scope,
              request: openRPCExampleToJSON(example as MethodObject),
            },
          };

          setInvokeMethodRequests((prev) => ({
            ...prev,
            [scope]: JSON.stringify(defaultRequest, null, 2),
          }));
        },
      );
      setSelectedMethods(initialSelectedMethods);
      setSelectedAccounts(initialSelectedAccounts);
    }
  }, [createSessionResult?.sessionScopes, metamaskOpenrpcDocument]);

  const handleMethodSelect = (
    evt: React.ChangeEvent<HTMLSelectElement>,
    scope: string,
  ) => {
    const selectedMethod = evt.target.value;
    setSelectedMethods((prev) => ({
      ...prev,
      [scope]: selectedMethod,
    }));

    const example = metamaskOpenrpcDocument?.methods.find(
      (method) => (method as MethodObject).name === selectedMethod,
    );

    if (example) {
      const exampleParams = openRPCExampleToJSON(example as MethodObject);
      const selectedAddress = selectedAccounts[scope];

      // Insert signing address if applicable
      const updatedParams = insertSigningAddress(
        selectedMethod,
        exampleParams,
        selectedAddress,
      );

      const defaultRequest = {
        method: 'wallet_invokeMethod',
        params: {
          scope,
          request: updatedParams,
        },
      };

      setInvokeMethodRequests((prev) => ({
        ...prev,
        [scope]: JSON.stringify(defaultRequest, null, 2),
      }));
    }
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
            <button onClick={handleConnect}>Connect</button>
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
            {Object.entries(FEATURED_NETWORKS).map(([chainId, networkName]) => (
              <label key={chainId}>
                <input
                  type="checkbox"
                  name={chainId}
                  checked={selectedScopes[chainId] ?? false}
                  onChange={(evt) =>
                    setSelectedScopes((prev) => ({
                      ...prev,
                      [chainId]: evt.target.checked,
                    }))
                  }
                />{' '}
                {networkName}
              </label>
            ))}
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
            <div className="session-lifecycle-buttons">
              <button id="create-session-btn" onClick={handleCreateSession}>
                wallet_createSession
              </button>
              <button id="get-session-btn" onClick={handleGetSession}>
                wallet_getSession
              </button>
              <button id="revoke-session-btn" onClick={handleRevokeSession}>
                wallet_revokeSession
              </button>
              <button id="clear-state-btn" onClick={handleResetState}>
                Clear State
              </button>
            </div>
          </div>

          <div className="session-divider" />

          {(createSessionResult || getSessionResult || revokeSessionResult) && (
            <div className="session-results-grid">
              {createSessionResult && (
                <div className="session-info">
                  <h3>Connected Accounts</h3>
                  <ul className="connection-list">
                    {Object.values(createSessionResult.sessionScopes ?? {})
                      .flatMap((scope: any) => scope.accounts ?? [])
                      .map((account: string) => account.split(':').pop() ?? '')
                      .filter((address: string) => address !== '')
                      .filter(
                        (address: string, index: number, array: string[]) =>
                          array.indexOf(address) === index,
                      )
                      .map((address: string) => (
                        <li key={address}>{address}</li>
                      )) || <li>No accounts connected</li>}
                  </ul>

                  <h3>Connected Chains</h3>
                  <ul className="connection-list">
                    {Object.keys(createSessionResult.sessionScopes ?? {}).map(
                      (chain: string) => <li key={chain}>{chain}</li>,
                    ) ?? <li>No chains connected</li>}
                  </ul>
                </div>
              )}

              <div
                className={`session-result ${
                  isResultExpanded ? 'expanded' : ''
                }`}
              >
                {(createSessionResult ||
                  getSessionResult ||
                  revokeSessionResult) && (
                  <>
                    {createSessionResult && (
                      <div className="result-item">
                        <h4>Create Session Result:</h4>
                        <details>
                          <summary className="result-summary">
                            {truncateJSON(createSessionResult).text}
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
                            {truncateJSON(getSessionResult).text}
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
                            {truncateJSON(revokeSessionResult).text}
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
                <button
                  className="session-result-toggle"
                  onClick={() => setIsResultExpanded(!isResultExpanded)}
                >
                  {isResultExpanded ? 'Show Less' : 'Show More'}
                </button>
              </div>
            </div>
          )}
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
            <div className="scopes-grid">
              {Object.entries(createSessionResult.sessionScopes).map(
                ([scope, details]: [string, any]) => (
                  <div key={scope} className="scope-card">
                    <h3
                      title={
                        FEATURED_NETWORKS[
                          scope as keyof typeof FEATURED_NETWORKS
                        ]
                          ? `${
                              FEATURED_NETWORKS[
                                scope as keyof typeof FEATURED_NETWORKS
                              ]
                            } (${scope})`
                          : scope
                      }
                      className="scope-card-title"
                    >
                      {FEATURED_NETWORKS[
                        scope as keyof typeof FEATURED_NETWORKS
                      ]
                        ? `${
                            FEATURED_NETWORKS[
                              scope as keyof typeof FEATURED_NETWORKS
                            ]
                          } (${scope})`
                        : scope}
                    </h3>

                    <select
                      className="accounts-select"
                      value={selectedAccounts[scope] ?? ''}
                      onChange={(evt) => {
                        setSelectedAccounts((prev) => ({
                          ...prev,
                          [scope]: evt.target.value,
                        }));
                      }}
                    >
                      <option value="">Select an account</option>
                      {(details.accounts ?? []).map((account: string) => {
                        const address = account.split(':').pop();
                        return (
                          <option key={account} value={account}>
                            {address}
                          </option>
                        );
                      })}
                    </select>

                    <select
                      value={selectedMethods[scope] ?? ''}
                      onChange={(evt) => handleMethodSelect(evt, scope)}
                    >
                      <option value="">Select a method</option>
                      {details.methods.map((method: string) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>

                    <details className="collapsible-section">
                      <summary>Invoke Method Request</summary>
                      <div className="collapsible-content">
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
                    </details>

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

                    {Object.keys(invokeMethodResults?.[scope] ?? {}).length >
                      0 &&
                      Object.entries(invokeMethodResults[scope] ?? {}).map(
                        ([method, results]) => {
                          return results.map((result, index) => {
                            const { text, truncated } = truncateJSON(
                              result,
                              150,
                            );

                            return truncated ? (
                              <details
                                key={`${method}-${index}`}
                                className="collapsible-section"
                              >
                                <summary>
                                  <span className="result-method">
                                    {method}:
                                  </span>
                                  <span className="result-preview">
                                    {JSON.stringify(result).slice(0, 100)}...
                                  </span>
                                </summary>
                                <div className="collapsible-content">
                                  <code className="code-left-align">
                                    <pre
                                      id={`invoke-method-${scope}-${method}-result-${index}`}
                                    >
                                      {JSON.stringify(result, null, 2)}
                                    </pre>
                                  </code>
                                </div>
                              </details>
                            ) : (
                              <div
                                key={`${method}-${index}`}
                                className="result-item-small"
                              >
                                <h5>{method}:</h5>
                                <code className="code-left-align">
                                  <pre
                                    id={`invoke-method-${scope}-${method}-result-${index}`}
                                  >
                                    {text}
                                  </pre>
                                </code>
                              </div>
                            );
                          });
                        },
                      )}
                  </div>
                ),
              )}
            </div>
          </div>
        </section>
      )}
      <section className="notifications-section">
        <h2>Notifications</h2>
        <div className="notification-container">
          <h3>wallet_notify</h3>
          {walletNotifyResults && (
            <details>
              <summary className="result-summary">
                {truncateJSON(walletNotifyResults).text}
              </summary>
              <code className="code-left-align">
                <pre id="wallet-notify-result">
                  {JSON.stringify(walletNotifyResults, null, 2)}
                </pre>
              </code>
            </details>
          )}
        </div>

        <div className="notification-container">
          <h3>wallet_sessionChanged</h3>
          {walletSessionChangedResults && (
            <details>
              <summary className="result-summary">
                {truncateJSON(walletSessionChangedResults).text}
              </summary>
              <code className="code-left-align">
                <pre id="wallet-session-changed-result">
                  {JSON.stringify(walletSessionChangedResults, null, 2)}
                </pre>
              </code>
            </details>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;
