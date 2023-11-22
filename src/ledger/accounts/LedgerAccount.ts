export interface LedgerAccount {
  uniqueNameIdentifier: string;
}

export const account = (name: string, id?: number): LedgerAccount => {
  return {} as unknown as LedgerAccount;
};
