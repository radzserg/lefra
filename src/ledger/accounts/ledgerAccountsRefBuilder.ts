import { LedgerNotFoundError } from '@/errors.js';
import { EntityAccountRef } from '@/ledger/accounts/EntityAccountRef.js';
import { SystemAccountRef } from '@/ledger/accounts/SystemAccountRef.js';
import { DB_ID, LedgerSpecification } from '@/types.js';

type AccountsRefBuilder<S extends LedgerSpecification> = {
  (slug: S['systemAccounts'][number]): SystemAccountRef;
  (slug: S['entityAccountTypes'][number], externalId: DB_ID): EntityAccountRef;
};

export const ledgerAccountsRefBuilder = <S extends LedgerSpecification>(
  specification: S,
) => {
  const {
    entityAccountTypes,
    slug: ledgerSlug,
    systemAccounts,
  } = specification;

  return ((
    slug: S['systemAccounts'][number] | S['entityAccountTypes'][number],
    externalId?: DB_ID,
  ) => {
    if (externalId !== undefined) {
      if (!entityAccountTypes.includes(slug)) {
        throw new LedgerNotFoundError(
          `Invalid entity account reference. Entity account type ${slug} is not defined.`,
        );
      }

      return new EntityAccountRef(ledgerSlug, slug, externalId);
    }

    if (systemAccounts.includes(slug)) {
      return new SystemAccountRef(ledgerSlug, slug);
    }

    throw new LedgerNotFoundError(`Invalid account slug: ${slug}`);
  }) as AccountsRefBuilder<S>;
};
