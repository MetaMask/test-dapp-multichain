/**
 * Formats addresses with respective scope to create a session. See [CAIP-25](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-25.md).
 * @param scope - The scope to create session for.
 * @param addresses - The addresses to create session for. If address is empty, we remove it from the array.
 * @returns The formatted addresses with the scope to create session for.
 */
export const getCreateSessionOptionalScopesFormattedAddresses = (
  scope: string,
  addresses: string[],
): string[] => {
  return addresses.reduce<string[]>((result, address) => {
    if (address.length > 0) {
      result.push(`${scope}:${address}`);
    }
    return result;
  }, []);
};
