// TODO: validate EVM address ?
export const getCreateSessionOptionalScopesFormattedAddresses = (
  scope: string,
  addresses: string[],
): string[] => {
  return addresses.map((address) => scope.concat(`:${address}`));
};
