export class LedgerError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class LedgerOperationError extends LedgerError {
  constructor(message: string) {
    super(message);
  }
}
