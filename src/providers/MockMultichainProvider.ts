const makeProvider = (getSession: () => any) => {
  // Function to simulate MetaMask provider
  const provider = {
    request: async ({ method, params }: { method: string; params: any }) => {
      console.log(`Calling ${method} with params:`, params);
      // Simulate responses based on method
      switch (method) {
        case 'wallet_createSession':
          return {
            sessionScopes: params.requiredScopes,
          };
        case 'wallet_getSession':
          return getSession();
        case 'wallet_revokeSession':
          return true;
        case 'wallet_invokeMethod':
          return 'Method invocation result';
        default:
          throw new Error('Method not implemented');
      }
    },
  };
  return provider;
};

export default makeProvider;
