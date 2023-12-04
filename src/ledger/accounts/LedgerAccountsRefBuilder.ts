import { LedgerNotFoundError } from '@/errors.js';
import { EntityAccountRef } from '@/ledger/accounts/EntityAccountRef.js';
import { SystemAccountRef } from '@/ledger/accounts/SystemAccountRef.js';
import { DB_ID, LedgerSpecification } from '@/types.js';

export class LedgerAccountsRefBuilder<S extends LedgerSpecification> {
  protected slug: LedgerSpecification['slug'];

  protected systemAccounts: S['systemAccounts'];

  protected entityAccountTypes: S['entityAccountTypes'];

  public constructor(specification: S) {
    this.slug = specification.slug;
    this.systemAccounts = specification.systemAccounts;
    this.entityAccountTypes = specification.entityAccountTypes;
  }

  public get systemAccount() {
    return (slug: S['systemAccounts'][number]): SystemAccountRef => {
      if (!this.systemAccounts.includes(slug)) {
        throw new LedgerNotFoundError(`Invalid system account slug: ${slug}`);
      }

      return new SystemAccountRef(this.slug, slug);
    };
  }

  public get entityAccount() {
    return (
      slug: S['entityAccountTypes'][number],
      externalId: DB_ID,
    ): EntityAccountRef => {
      if (!this.entityAccountTypes.includes(slug)) {
        throw new LedgerNotFoundError(`Invalid entity account slug: ${slug}`);
      }

      return new EntityAccountRef(this.slug, slug, externalId);
    };
  }
}
