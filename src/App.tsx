/* eslint-disable @typescript-eslint/no-misused-promises */
import React, { useState } from 'react';
import './App.css';

let currentSession: any = null;

// Function to simulate MetaMask provider
const provider = {
  request: async ({ method, params }: { method: string; params: any }) => {
    console.log(`Calling ${method} with params:`, params);
    // Simulate responses based on method
    switch (method) {
      case 'wallet_createSession':
        currentSession = {
          sessionScopes: params.requiredScopes,
        };
        return currentSession;
      case 'wallet_getSession':
        return currentSession;
      case 'wallet_revokeSession':
        return true;
      case 'wallet_invokeMethod':
        return 'Method invocation result';
      default:
        throw new Error('Method not implemented');
    }
  },
};

function App() {
  const [createSessionResult, setCreateSessionResult] = useState<any>(null);
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

  // Add this new function to clear all state
  const handleResetState = () => {
    setCreateSessionResult(null);
    setGetSessionResult(null);
    setRevokeSessionResult(null);
    setSelectedMethods({});
    setInvokeMethodResults({});
    setCustomScope('');
    setSelectedScopes({
      'eip155:1337': false,
      'eip155:1': false,
    });
    currentSession = null; // Reset the global currentSession variable
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

      const result = await provider.request({
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
      const result = await provider.request({
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
      const result = await provider.request({
        method: 'wallet_revokeSession',
        params: [],
      });
      if (result) {
        setRevokeSessionResult(result);
      }
    } catch (error) {
      console.error('Error revoking session:', error);
    }
  };

  const handleInvokeMethod = async (scope: string, method: string) => {
    try {
      const result = await provider.request({
        method: 'wallet_invokeMethod',
        params: [scope, { method, params: [] }],
      });
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
        <h2>Session Lifecycle</h2>
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
                    onChange={(evt) =>
                      setSelectedMethods((prev) => ({
                        ...prev,
                        [scope]: evt.target.value,
                      }))
                    }
                  >
                    <option value="">Select a method</option>
                    {details.methods.map((method: string) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={async () => {
                      const selectedMethod = selectedMethods[scope];
                      if (selectedMethod) {
                        await handleInvokeMethod(scope, selectedMethod);
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
                            <pre>{JSON.stringify(result, null, 2)}</pre>
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
        <div>{JSON.stringify(getSessionResult)}</div>
        <button onClick={handleRevokeSession}>wallet_revokeSession</button>
        <div>{JSON.stringify(revokeSessionResult)}</div>
        <br />
        <br />
        <br />
        <button onClick={handleResetState}>Clear</button>
      </div>
    </div>
  );
}

export default App;
