export class LedgerError extends Error {}
export class LedgerOperationError extends LedgerError {}
export class LedgerAccountError extends LedgerError {}
export class LedgerNotFoundError extends Error {}
export class LedgerUnexpectedError extends Error {}
