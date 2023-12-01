import { EntityAccountRef } from '@/ledger/accounts/EntityAccountRef.js';
import { SystemAccountRef } from '@/ledger/accounts/SystemAccountRef.js';
import { DB_ID } from '@/types.js';

// this will be automatically generated

type UserLedgerAccountType = 'RECEIVABLES' | 'PAYABLE_LOCKED' | 'PAYABLE';
type SystemAccountType =
  | 'INCOME_PAID_PROJECTS'
  | 'INCOME_PAYMENT_FEE'
  | 'INCOME_CONTRACT_FEES'
  | 'EXPENSES_PAYOUTS'
  | 'EXPENSES_STRIPE_PAY_IN_FEES'
  | 'EXPENSES_STRIPE_CONTRACT_FEES'
  | 'CURRENT_ASSETS_STRIPE_PLATFORM_USA'
  | 'EXPENSES_CURRENCY_CONVERSION_LOSSES'
  | 'INCOME_STRIPE_PAY_IN_FEES'
  | 'INCOME_CURRENCY_CONVERSION_GAINS';

export class CustomLedger {
  public constructor(public readonly ledgerId: DB_ID) {}

  public accountFactories() {
    return {
      systemAccount: (name: SystemAccountType) => {
        return new SystemAccountRef(this.ledgerId, name);
      },
      userAccount: (name: UserLedgerAccountType, userAccountId: number) => {
        return new EntityAccountRef(this.ledgerId, name, userAccountId, 'USER');
      },
    };
  }
}
