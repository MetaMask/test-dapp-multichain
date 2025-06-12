import {
  type CaipChainId,
  type Json,
  type CaipAccountId,
  parseCaipChainId,
} from '@metamask/utils';
import type { MethodObject } from '@open-rpc/meta-schema';
import type { Dispatch, SetStateAction } from 'react';

import {
  injectParams,
  METHODS_REQUIRING_PARAM_INJECTION,
} from '../constants/methods';
import { openRPCExampleToJSON } from './JsonHelpers';
import { generateSolanaMethodExamples } from './solana-method-signatures';

/**
 * Updates the invoke method results state in an immutable way.
 *
 * @param previousResults - Previous invoke method results state.
 * @param scope - The scope being updated.
 * @param method - The method being updated.
 * @param result - The result or error to add.
 * @param request - The request that was made.
 * @returns Updated results state.
 */
export const updateInvokeMethodResults = (
  previousResults: Record<
    string,
    Record<string, { result: Json | Error; request: Json }[]>
  >,
  scope: CaipChainId,
  method: string,
  result: Json | Error,
  request: Json,
) => {
  const scopeResults = previousResults[scope] ?? {};
  const methodResults = scopeResults[method] ?? [];
  const newResults = {
    ...previousResults,
    [scope]: {
      ...scopeResults,
      [method]: [...methodResults, { result, request }],
    },
  };

  return newResults;
};

export const extractRequestParams = (finalRequestObject: {
  params: { request: { params: Json } };
}): Json => {
  return finalRequestObject.params.request.params;
};

export const extractRequestForStorage = (finalRequestObject: {
  params: { request: Json };
}): Json => {
  return finalRequestObject.params.request;
};

/**
 * Auto-selects the first available account for a scope if none is currently selected.
 * Updates the provided setter function with the selected account.
 *
 * @param caipChainId - The CAIP chain ID of the scope.
 * @param currentSelectedAccount - The currently selected account for this scope.
 * @param currentSession - The current session object.
 * @param setSelectedAccounts - Function to update the selected accounts state.
 * @returns The selected account or null if none available.
 */
export const autoSelectAccountForScope = (
  caipChainId: CaipChainId,
  currentSelectedAccount: CaipAccountId | null,
  currentSession: any,
  setSelectedAccounts: Dispatch<
    SetStateAction<Record<string, CaipAccountId | null>>
  >,
): CaipAccountId | null => {
  if (currentSelectedAccount) {
    return currentSelectedAccount;
  }

  const scopeDetails = currentSession?.sessionScopes?.[caipChainId];
  if (scopeDetails?.accounts && scopeDetails.accounts.length > 0) {
    const firstAccount = scopeDetails.accounts[0];
    console.log(
      `🔧 Auto-selecting first account for ${caipChainId}: ${String(
        firstAccount,
      )}`,
    );

    setSelectedAccounts((prev) => ({
      ...prev,
      [caipChainId]: firstAccount,
    }));

    return firstAccount;
  }

  console.error(`❌ No accounts available for scope ${caipChainId}`);
  return null;
};

/**
 * Determines if a method is EVM, Solana, or other type.
 *
 * @param chainId - The CAIP chain ID.
 * @returns The type of method.
 */
const determineMethodType = (
  chainId: CaipChainId,
): 'evm' | 'solana' | 'unknown' => {
  const { namespace } = parseCaipChainId(chainId);

  switch (namespace) {
    case 'eip155':
      return 'evm';
    case 'solana':
      return 'solana';
    default:
      return 'unknown';
  }
};

/**
 * Handles Solana-specific method preparation.
 *
 * @param method - The method name to invoke.
 * @param selectedAccount - The selected account for this scope.
 * @returns The prepared request object or null if method not found.
 */
const handleSolanaMethod = async (
  method: string,
  selectedAccount: CaipAccountId,
): Promise<Json | null> => {
  const address = selectedAccount.split(':')[2] ?? '';
  const example = await generateSolanaMethodExamples(method, address);

  if (!example) {
    console.error(`❌ No example found for Solana method: ${method}`);
    return null;
  }

  return example;
};

/**
 * Handles EVM-specific method preparation.
 *
 * @param method - The method name to invoke.
 * @param selectedAccount - The selected account for this scope.
 * @param caipChainId - The CAIP chain ID.
 * @param metamaskOpenrpcDocument - The MetaMask OpenRPC document.
 * @returns The prepared request object or null if method not found.
 */
const handleEVMMethod = async (
  method: string,
  selectedAccount: CaipAccountId,
  caipChainId: CaipChainId,
  metamaskOpenrpcDocument: any,
): Promise<Json | null> => {
  const example = metamaskOpenrpcDocument?.methods.find(
    (methodObj: MethodObject) => methodObj.name === method,
  );

  if (!example) {
    console.error(`❌ No example found for EVM method: ${method}`);
    return null;
  }

  let exampleParams = openRPCExampleToJSON(example as MethodObject);

  if (method in METHODS_REQUIRING_PARAM_INJECTION && exampleParams !== null) {
    exampleParams = injectParams(
      method,
      exampleParams,
      selectedAccount,
      caipChainId,
    ) as { method: string; params: any };
  }

  return exampleParams;
};

/**
 * Prepares a method request object for invocation.
 *
 * @param method - The method name to invoke.
 * @param caipChainId - The CAIP chain ID.
 * @param selectedAccount - The selected account for this scope.
 * @param metamaskOpenrpcDocument - The MetaMask OpenRPC document.
 * @returns The prepared request object or null if method not found.
 */
export const prepareMethodRequest = async (
  method: string,
  caipChainId: CaipChainId,
  selectedAccount: CaipAccountId | null,
  metamaskOpenrpcDocument: any,
): Promise<Json | null> => {
  const methodType = determineMethodType(caipChainId);

  if (!selectedAccount) {
    console.error(`❌ No account selected for method: ${method}`);
    return null;
  }

  if (methodType === 'unknown') {
    console.error(`❌ Unsupported method type for: ${method}`);
    return null;
  }

  let exampleParams: Json | null = null;

  switch (methodType) {
    case 'solana':
      exampleParams = await handleSolanaMethod(method, selectedAccount);
      break;
    case 'evm':
      exampleParams = await handleEVMMethod(
        method,
        selectedAccount,
        caipChainId,
        metamaskOpenrpcDocument,
      );
      break;
    default:
      console.error(`❌ Unsupported method type for: ${method}`);
      return null;
  }

  if (!exampleParams) {
    return null;
  }

  return {
    method: 'wallet_invokeMethod',
    params: {
      scope: caipChainId,
      request: exampleParams,
    },
  };
};
