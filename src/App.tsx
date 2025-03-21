/* eslint-disable @typescript-eslint/no-misused-promises */
import { MetaMaskOpenRPCDocument } from '@metamask/api-specs';
import { parseCaipAccountId } from '@metamask/utils';
import type { CaipAccountId, CaipChainId, Json } from '@metamask/utils';
import type { MethodObject, OpenrpcDocument } from '@open-rpc/meta-schema';
import { parseOpenRPCDocument } from '@open-rpc/schema-utils-js';
import React, { useCallback, useEffect, useState } from 'react';

import './App.css';
import DynamicInputs, { INPUT_LABEL_TYPE } from './components/DynamicInputs';
import WalletList from './components/WalletList';
import type { WalletMapEntry } from './components/WalletList';
import {
  injectParams,
  METHODS_REQUIRING_PARAM_INJECTION,
} from './constants/methods';
import { FEATURED_NETWORKS } from './constants/networks';
import { openRPCExampleToJSON, truncateJSON } from './helpers/JsonHelpers';
import { useSDK } from './sdk';
import { WINDOW_POST_MESSAGE_ID } from './sdk/SDK';

function App() {
  const [addresses, setAddresses] = useState<string[]>(['']);
  const [solanaAddresses, setSolanaAddresses] = useState<string[]>(['']);
  const [walletMapEntries, setWalletMapEntries] = useState<
    Record<string, WalletMapEntry>
  >({});
  const [providerType, setProviderType] = useState<string>('metamask');
  const [selectedMethods, setSelectedMethods] = useState<
    Record<string, string>
  >({});
  const [invokeMethodResults, setInvokeMethodResults] = useState<
    Record<string, Record<string, { result: any; request: any }[]>>
  >({});
  const [customScopes, setCustomScopes] = useState<string[]>(['']);
  const [selectedScopes, setSelectedScopes] = useState<
    Record<CaipChainId, boolean>
  >({
    'eip155:1': true,
    'eip155:59144': true,
    'eip155:42161': false,
    'eip155:43114': false,
    'eip155:56': false,
    'eip155:10': false,
    'eip155:137': false,
    'eip155:324': false,
    'eip155:8453': false,
    'eip155:1337': false,
  });
  const [extensionId, setExtensionId] = useState<string>('');
  const [invokeMethodRequests, setInvokeMethodRequests] = useState<
    Record<string, string>
  >({});
  const [metamaskOpenrpcDocument, setMetamaskOpenrpcDocument] =
    useState<OpenrpcDocument>();
  const [selectedAccounts, setSelectedAccounts] = useState<
    Record<string, CaipAccountId>
  >({});
  const [walletSessionChangedHistory, setWalletSessionChangedHistory] =
    useState<{ timestamp: number; data: any }[]>([]);
  const [walletNotifyHistory, setWalletNotifyHistory] = useState<
    { timestamp: number; data: any }[]
  >([]);
  const [sessionMethodHistory, setSessionMethodHistory] = useState<
    { timestamp: number; method: string; data: any }[]
  >([]);

  const setInitialMethodsAndAccounts = (currentSession: any) => {
    const initialSelectedMethods: Record<string, string> = {};
    const initialSelectedAccounts: Record<string, CaipAccountId> = {};

    Object.entries(currentSession.sessionScopes).forEach(
      ([scope, details]: [string, any]) => {
        if (details.accounts && details.accounts.length > 0) {
          initialSelectedAccounts[scope] = details.accounts[0];
        }
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
      },
    );
    setSelectedMethods(initialSelectedMethods);
    setSelectedAccounts(initialSelectedAccounts);
  };

  const setSelectedScopesFromSession = (sessionScopes: any) => {
    const connectedScopes = Object.keys(sessionScopes || {});
    setSelectedScopes(() => {
      const newScopes: Record<string, boolean> = {};
      connectedScopes.forEach((scope) => {
        newScopes[scope] = true;
      });
      return newScopes;
    });
  };

  const handleSessionChangedNotification = useCallback(
    (notification: any) => {
      setWalletSessionChangedHistory((prev) => {
        const timestamp = Date.now();
        if (prev.some((entry) => entry.timestamp === timestamp)) {
          return prev;
        }
        return [{ timestamp, data: notification }, ...prev];
      });

      if (notification.params?.sessionScopes) {
        setSelectedScopesFromSession(notification.params.sessionScopes);
        setInitialMethodsAndAccounts(notification.params.sessionScopes);
      }
    },
    [
      setWalletSessionChangedHistory,
      setSelectedScopesFromSession,
      setInitialMethodsAndAccounts,
    ],
  );

  const handleNotification = useCallback(
    (notification: any) => {
      setWalletNotifyHistory((prev) => {
        const timestamp = Date.now();
        if (prev.some((entry) => entry.timestamp === timestamp)) {
          return prev;
        }
        return [{ timestamp, data: notification }, ...prev];
      });
    },
    [setWalletNotifyHistory],
  );

  const handleWalletAnnounce = useCallback(
    (ev: Event) => {
      const customEvent = ev as CustomEvent;
      const { extensionId: announcedId, rdns } = customEvent.detail.params;
      const newExtensionId =
        rdns === 'io.metamask.flask' && !announcedId
          ? WINDOW_POST_MESSAGE_ID
          : announcedId;
      const newEntry: WalletMapEntry = {
        params: {
          ...customEvent.detail.params,
          extensionId: newExtensionId,
        },
      };
      setExtensionId(newExtensionId);
      setWalletMapEntries((prev) => ({
        ...prev,
        [customEvent.detail.params.uuid]: newEntry,
      }));
    },
    [setExtensionId, setWalletMapEntries],
  );

  const {
    isConnected: isExternallyConnectableConnected,
    currentSession,
    connect,
    disconnect,
    createSession,
    revokeSession,
    getSession,
    invokeMethod,
    extensionId: loadedExtensionId,
  } = useSDK({
    onSessionChanged: handleSessionChangedNotification,
    onWalletNotify: handleNotification,
    onWalletAnnounce: handleWalletAnnounce,
  });

  useEffect(() => {
    setExtensionId(loadedExtensionId);
  }, [loadedExtensionId]);

  const handleConnectClick = async () => {
    if (extensionId) {
      try {
        await connect(extensionId);
      } catch (error) {
        console.error('Error connecting:', error);
      }
    }
  };

  const handleWalletListClick = useCallback(
    async (newExtensionId: string): Promise<void> => {
      setExtensionId(newExtensionId);
      try {
        await connect(newExtensionId);
      } catch (error) {
        console.error('Error connecting:', error);
      }
    },
    [setExtensionId, handleConnectClick],
  );

  useEffect(() => {
    parseOpenRPCDocument(MetaMaskOpenRPCDocument)
      .then((parsedOpenRPCDocument) => {
        setMetamaskOpenrpcDocument(parsedOpenRPCDocument);
      })
      .catch(() => {
        console.error('Error parsing metamask openrpc document');
      });
  }, []);

  const handleResetState = () => {
    setSelectedMethods({});
    setInvokeMethodResults({});
    setCustomScopes(['']);
    setWalletSessionChangedHistory([]);
    setWalletNotifyHistory([]);
    setSessionMethodHistory([]);
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
      'eip155:1337': false,
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': false,
    });
  };

  useEffect(() => {
    if (!isExternallyConnectableConnected) {
      handleResetState();
    }
  }, [isExternallyConnectableConnected]);

  const handleCreateSession = async () => {
    const selectedScopesArray = [
      ...Object.keys(selectedScopes).filter(
        (scope) => selectedScopes[scope as CaipChainId],
      ),
      ...customScopes.filter((scope) => scope.length),
    ];

    try {
      const evmScopes = selectedScopesArray.filter((scope) =>
        scope.startsWith('eip155:'),
      );
      const solanaScopes = selectedScopesArray.filter((scope) =>
        scope.startsWith('solana:'),
      );

      let evmScopeAddressList: string[] = [];
      let solanaScopeAddressList: string[] = [];

      if (evmScopes.length > 0) {
        evmScopeAddressList = [
          ...addresses.filter((addr) => addr.trim() !== ''),
        ];
      }

      if (solanaScopes.length > 0) {
        solanaScopeAddressList = [
          ...solanaAddresses.filter((addr) => addr.trim() !== ''),
        ];
      }
      const result = await createSession(
        selectedScopesArray as CaipChainId[],
        evmScopeAddressList,
        solanaScopeAddressList,
      );
      setSessionMethodHistory((prev) => {
        const timestamp = Date.now();
        if (prev.some((entry) => entry.timestamp === timestamp)) {
          return prev;
        }
        return [
          { timestamp, method: 'wallet_createSession', data: result },
          ...prev,
        ];
      });
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleGetSession = async () => {
    try {
      const result = await getSession();
      setSessionMethodHistory((prev) => {
        const timestamp = Date.now();
        if (prev.some((entry) => entry.timestamp === timestamp)) {
          return prev;
        }
        return [
          { timestamp, method: 'wallet_getSession', data: result },
          ...prev,
        ];
      });
    } catch (error) {
      console.error('Error getting session:', error);
    }
  };

  const handleRevokeSession = async () => {
    try {
      const result = await revokeSession();
      setSessionMethodHistory((prev) => {
        const timestamp = Date.now();
        if (prev.some((entry) => entry.timestamp === timestamp)) {
          return prev;
        }
        return [
          { timestamp, method: 'wallet_revokeSession', data: result },
          ...prev,
        ];
      });
    } catch (error) {
      console.error('Error revoking session:', error);
    }
  };

  const handleInvokeMethod = async (scope: CaipChainId, method: string) => {
    const requestObject = JSON.parse(invokeMethodRequests[scope] ?? '{}');
    try {
      const { params } = requestObject.params.request;
      const result = await invokeMethod(scope, {
        method,
        params,
      });

      setInvokeMethodResults((prev) => {
        const scopeResults = prev[scope] ?? {};
        const methodResults = scopeResults[method] ?? [];
        return {
          ...prev,
          [scope]: {
            ...scopeResults,
            [method]: [
              ...methodResults,
              { result, request: requestObject.params.request },
            ],
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
            [method]: [
              ...methodResults,
              { result: error, request: requestObject.params.request },
            ],
          },
        };
      });
      console.error('Error invoking method:', error);
    }
  };

  const handleInvokeAllMethods = async () => {
    const scopesWithMethods = Object.entries(selectedMethods)
      .filter(([_, method]) => method)
      .map(([scope, method]) => ({ scope, method }));

    await Promise.all(
      scopesWithMethods.map(async ({ scope, method }) => {
        const scopeToInvoke = scope as keyof typeof selectedScopes;
        return handleInvokeMethod(scopeToInvoke, method);
      }),
    );
  };

  useEffect(() => {
    if (currentSession?.sessionScopes) {
      setInitialMethodsAndAccounts(currentSession);
      setSelectedScopesFromSession(currentSession.sessionScopes);
    }
  }, [currentSession]);

  const handleMethodSelect = (
    evt: React.ChangeEvent<HTMLSelectElement>,
    scope: CaipChainId,
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
      let exampleParams: Json = openRPCExampleToJSON(example as MethodObject);
      const selectedAddress = selectedAccounts[scope];

      if (
        selectedAddress &&
        selectedMethod in METHODS_REQUIRING_PARAM_INJECTION
      ) {
        exampleParams = injectParams(
          selectedMethod,
          exampleParams,
          selectedAddress,
          scope,
        );
      }

      const defaultRequest = {
        method: 'wallet_invokeMethod',
        params: {
          scope,
          request: exampleParams,
        },
      };

      setInvokeMethodRequests((prev) => ({
        ...prev,
        [scope]: JSON.stringify(defaultRequest, null, 2),
      }));
    }
  };

  const handleClearInvokeResults = () => {
    setInvokeMethodResults({});
  };

  useEffect(() => {
    if (!isExternallyConnectableConnected) {
      handleResetState();
    }
  }, [isExternallyConnectableConnected]);

  return (
    <div className="App">
      <h1>MetaMask MultiChain API Test Dapp</h1>
      <div className="app-subtitle">
        <i>Requires MetaMask Extension with CAIP Multichain API Enabled</i>
      </div>
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
              disabled={isExternallyConnectableConnected}
            />
            <button
              onClick={handleConnectClick}
              disabled={isExternallyConnectableConnected}
            >
              Connect
            </button>
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
              disconnect();
              setExtensionId('');
              localStorage.removeItem('extensionId');
            }}
          >
            Clear Extension ID
          </button>
        </div>
      </section>
      <section>
        <div>
          <h2>Detected Wallets</h2>
        </div>
        <div>
          <WalletList
            wallets={walletMapEntries}
            handleClick={handleWalletListClick}
            connectedExtensionId={
              isExternallyConnectableConnected ? extensionId : ''
            }
          />
        </div>
      </section>
      <section>
        <div>
          <h2>Session Lifecycle</h2>
          <div className="session-layout">
            <div className="session-column">
              <div className="create-session-container">
                <h3>Create Session</h3>
                {Object.entries(FEATURED_NETWORKS).map(
                  ([chainId, networkName]) => (
                    <label key={chainId}>
                      <input
                        type="checkbox"
                        name={chainId}
                        checked={
                          selectedScopes[chainId as CaipChainId] ?? false
                        }
                        onChange={(evt) =>
                          setSelectedScopes((prev) => ({
                            ...prev,
                            [chainId]: evt.target.checked,
                          }))
                        }
                        disabled={!isExternallyConnectableConnected}
                      />{' '}
                      {networkName}
                    </label>
                  ),
                )}
                <div>
                  <DynamicInputs
                    inputArray={customScopes}
                    setInputArray={setCustomScopes}
                    label={INPUT_LABEL_TYPE.SCOPE}
                  />
                </div>
                <div>
                  <DynamicInputs
                    inputArray={addresses}
                    setInputArray={setAddresses}
                    label={INPUT_LABEL_TYPE.EVM_ADDRESS}
                  />
                </div>
                <div>
                  <DynamicInputs
                    inputArray={solanaAddresses}
                    setInputArray={setSolanaAddresses}
                    label={INPUT_LABEL_TYPE.SOLANA_ADDRESS}
                  />
                </div>
                <div className="session-lifecycle-buttons">
                  <button
                    id="create-session-btn"
                    onClick={handleCreateSession}
                    disabled={!isExternallyConnectableConnected}
                  >
                    <span className="code-method">wallet_createSession</span>
                  </button>
                  <button
                    id="get-session-btn"
                    onClick={handleGetSession}
                    disabled={!isExternallyConnectableConnected}
                  >
                    <span className="code-method">wallet_getSession</span>
                  </button>
                  <button
                    id="revoke-session-btn"
                    onClick={handleRevokeSession}
                    disabled={!isExternallyConnectableConnected}
                  >
                    <span className="code-method">wallet_revokeSession</span>
                  </button>
                </div>
              </div>

              {currentSession && (
                <div className="session-info">
                  <h3>Connected Accounts</h3>
                  <ul className="connection-list">
                    {Object.values(currentSession.sessionScopes ?? {})
                      .flatMap((scope: any) => scope.accounts ?? [])
                      .map(
                        (account: CaipAccountId) =>
                          parseCaipAccountId(account).address,
                      )
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
                    {Object.keys(currentSession.sessionScopes ?? {}).map(
                      (chain: string) => <li key={chain}>{chain}</li>,
                    ) ?? <li>No chains connected</li>}
                  </ul>
                </div>
              )}
            </div>

            <div className="session-column">
              {/* Session Results */}
              <div className="results-section">
                <h3>Session Lifecycle method results</h3>
                <div className="notification-container">
                  {sessionMethodHistory.length > 0 ? (
                    sessionMethodHistory.map(
                      ({ timestamp, method, data }, index) => (
                        <details key={timestamp}>
                          <summary className="result-summary">
                            <span className="timestamp">
                              {new Date(timestamp).toLocaleString()}
                            </span>
                            <span className="method-name">{method}</span>
                            {truncateJSON(data).text}
                          </summary>
                          <code className="code-left-align">
                            <pre id={`session-method-result-${index}`}>
                              {JSON.stringify(data, null, 2)}
                            </pre>
                          </code>
                        </details>
                      ),
                    )
                  ) : (
                    <p>No session method calls</p>
                  )}
                </div>
              </div>

              {/* Session Changes */}
              <div className="results-section">
                <h3>
                  <span className="code-method">wallet_sessionChanged</span>{' '}
                </h3>
                <div className="notification-container">
                  {walletSessionChangedHistory.length > 0 ? (
                    walletSessionChangedHistory.map(
                      ({ timestamp, data }, index) => (
                        <details key={timestamp}>
                          <summary className="result-summary">
                            <span className="timestamp">
                              {new Date(timestamp).toLocaleString()}
                            </span>
                            {truncateJSON(data).text}
                          </summary>
                          <code className="code-left-align">
                            <pre id={`wallet-session-changed-result-${index}`}>
                              {JSON.stringify(data, null, 2)}
                            </pre>
                          </code>
                        </details>
                      ),
                    )
                  ) : (
                    <p>No session changes detected</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="session-divider" />
        </div>
      </section>
      {currentSession?.sessionScopes && isExternallyConnectableConnected && (
        <section>
          <div>
            <div className="scope-header">
              <h2>Connected Scopes</h2>
              <button onClick={handleClearInvokeResults}>Clear Results</button>
            </div>
            <button
              onClick={handleInvokeAllMethods}
              disabled={Object.keys(selectedMethods).length === 0}
              className="invoke-all-button"
            >
              Invoke All Selected Methods
            </button>
            <div className="scopes-grid">
              {Object.entries(currentSession.sessionScopes).map(
                ([scope, details]: [string, any]) => (
                  <div
                    data-testid={`scope-card-${scope}`}
                    key={scope}
                    className="scope-card"
                  >
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
                        const newAddress =
                          (evt.target.value as CaipAccountId) ?? '';
                        setSelectedAccounts((prev) => ({
                          ...prev,
                          [scope]: newAddress,
                        }));

                        const currentMethod = selectedMethods[scope];
                        if (currentMethod) {
                          const example = metamaskOpenrpcDocument?.methods.find(
                            (method) =>
                              (method as MethodObject).name === currentMethod,
                          );

                          if (example) {
                            let exampleParams: Json = openRPCExampleToJSON(
                              example as MethodObject,
                            );

                            exampleParams = injectParams(
                              currentMethod,
                              exampleParams,
                              newAddress,
                              scope as CaipChainId,
                            );

                            const updatedRequest = {
                              method: 'wallet_invokeMethod',
                              params: {
                                scope,
                                request: exampleParams,
                              },
                            };

                            setInvokeMethodRequests((prev) => ({
                              ...prev,
                              [scope]: JSON.stringify(updatedRequest, null, 2),
                            }));
                          }
                        }
                      }}
                    >
                      <option value="">Select an account</option>
                      {(details.accounts ?? []).map(
                        (account: CaipAccountId) => {
                          const { address } = parseCaipAccountId(account);
                          return (
                            <option
                              data-testid={`${String(account)}-option`}
                              key={address}
                              value={account}
                            >
                              {address}
                            </option>
                          );
                        },
                      )}
                    </select>

                    <select
                      data-testid={`${scope}-select`}
                      value={selectedMethods[scope] ?? ''}
                      onChange={(evt) =>
                        handleMethodSelect(evt, scope as CaipChainId)
                      }
                    >
                      <option value="">Select a method</option>
                      {details.methods.map((method: string) => (
                        <option
                          data-testid={`${scope}-${method}-option`}
                          key={method}
                          value={method}
                        >
                          {method}
                        </option>
                      ))}
                    </select>

                    <details className="collapsible-section">
                      <summary>Invoke Method Request</summary>
                      <div className="collapsible-content">
                        <textarea
                          data-testid={`${scope}-collapsible-content-textarea`}
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
                      data-testid={`invoke-method-${scope}-btn`}
                      onClick={async () => {
                        const method = selectedMethods[scope];
                        if (method) {
                          await handleInvokeMethod(
                            scope as CaipChainId,
                            method,
                          );
                        }
                      }}
                    >
                      Invoke Method
                    </button>

                    {Object.entries(invokeMethodResults[scope] ?? {}).map(
                      ([method, results]) => {
                        return results.map(({ result, request }, index) => {
                          const { text, truncated } = truncateJSON(result, 150);
                          return truncated ? (
                            <details
                              key={`${method}-${index}`}
                              className="collapsible-section"
                            >
                              <summary>
                                <span className="result-method">{method}</span>
                                <div className="result-params">
                                  Params: {JSON.stringify(request.params)}
                                </div>
                                <span className="result-preview">{text}</span>
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
                              <div className="result-header">
                                <span className="result-method">{method}</span>
                                <div className="result-params">
                                  Params: {JSON.stringify(request.params)}
                                </div>
                              </div>
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
        <h2>
          Notifications ( <span className="code-method">wallet_notify</span>)
        </h2>
        <div className="notification-container">
          {walletNotifyHistory.length > 0 ? (
            walletNotifyHistory.map(({ timestamp, data }, index) => (
              <details key={timestamp}>
                <summary className="result-summary">
                  <span className="timestamp">
                    {new Date(timestamp).toLocaleString()}
                  </span>
                  {truncateJSON(data).text}
                </summary>
                <code className="code-left-align">
                  <pre id={`wallet-notify-result-${index}`}>
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </code>
              </details>
            ))
          ) : (
            <p>No notifications received</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;
