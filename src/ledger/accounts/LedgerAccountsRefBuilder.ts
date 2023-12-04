import { LedgerNotFoundError } from '@/errors.js';
import { EntityAccountRef } from '@/ledger/accounts/EntityAccountRef.js';
import { SystemAccountRef } from '@/ledger/accounts/SystemAccountRef.js';
import { DB_ID, LedgerSpecification } from '@/types.js';

type AccountsRefBuilder<S extends LedgerSpecification> = {
  (slug: S['systemAccounts'][number]): SystemAccountRef;
  (slug: S['entityAccountTypes'][number], externalId: DB_ID): EntityAccountRef;
};

export class LedgerAccountsRefBuilder<S extends LedgerSpecification> {
  protected slug: LedgerSpecification['slug'];

  protected systemAccounts: S['systemAccounts'];

  protected entityAccountTypes: S['entityAccountTypes'];

  public constructor(specification: S) {
    this.slug = specification.slug;
    this.systemAccounts = specification.systemAccounts;
    this.entityAccountTypes = specification.entityAccountTypes;
  }

  public get account(): AccountsRefBuilder<S> {
    return ((
      slug: S['systemAccounts'][number] | S['entityAccountTypes'][number],
      externalId?: DB_ID,
    ) => {
      if (externalId !== undefined) {
        if (!this.entityAccountTypes.includes(slug)) {
          throw new LedgerNotFoundError(
            `Invalid entity account reference. Entity account type ${slug} is not defined.`,
          );
        }

        return new EntityAccountRef(this.slug, slug, externalId);
      }

      if (this.systemAccounts.includes(slug)) {
        return new SystemAccountRef(this.slug, slug);
      }

      throw new LedgerNotFoundError(`Invalid account slug: ${slug}`);
    }) as AccountsRefBuilder<S>;
  }
}
