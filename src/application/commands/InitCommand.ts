import { CommonCliOptions } from '@/application/types.js';
import fs from 'node:fs/promises';
import { sql } from 'slonik';

type CommandOptions = CommonCliOptions & {};

const DOLLAR_QUOTE_TAG = /^\$\w*\$/u;

/**
 * Splits a SQL script into individual statements. Slonik does not allow
 * multiple statements in a single query, so the schema has to be executed
 * statement by statement. Dollar quoted blocks (function bodies), string
 * literals and line comments are not treated as statement separators.
 */
const splitSqlStatements = (source: string): string[] => {
  const statements: string[] = [];

  let statement = '';
  let position = 0;

  while (position < source.length) {
    const character = source[position];

    const dollarQuote = DOLLAR_QUOTE_TAG.exec(source.slice(position));

    if (character === '$' && dollarQuote) {
      const [tag] = dollarQuote;
      const end = source.indexOf(tag, position + tag.length);
      const blockEnd = end === -1 ? source.length : end + tag.length;

      statement += source.slice(position, blockEnd);
      position = blockEnd;
      continue;
    }

    if (character === "'") {
      let end = position + 1;

      while (end < source.length) {
        if (source[end] === "'") {
          // '' is an escaped single quote and does not close the literal.
          if (source[end + 1] === "'") {
            end += 2;
            continue;
          }

          break;
        }

        end += 1;
      }

      statement += source.slice(position, end + 1);
      position = end + 1;
      continue;
    }

    if (source.startsWith('--', position)) {
      const end = source.indexOf('\n', position);
      const commentEnd = end === -1 ? source.length : end;

      statement += source.slice(position, commentEnd);
      position = commentEnd;
      continue;
    }

    if (character === ';') {
      statements.push(statement);
      statement = '';
      position += 1;
      continue;
    }

    statement += character;
    position += 1;
  }

  statements.push(statement);

  return statements
    .map((currentStatement) => {
      return currentStatement.trim();
    })
    .filter((currentStatement) => {
      return currentStatement.length > 0;
    });
};

export const InitCommand = async ({ dryRun, pool }: CommandOptions) => {
  const data = await fs.readFile(
    import.meta.dirname + '/../../../database/schema.sql',
    {
      encoding: 'utf8',
    },
  );

  if (dryRun) {
    // eslint-disable-next-line no-console
    console.log('Dry run, not executing SQL:\n\n' + data);
    return;
  }

  await pool.transaction(async (transaction) => {
    for (const statement of splitSqlStatements(data)) {
      // Slonik query tokens can only be created by its tagged template
      // literals, hence the schema statement is wrapped into one.
      const template = Object.assign([statement], {
        raw: Object.freeze([statement]),
      }) as unknown as TemplateStringsArray;

      await transaction.query(sql.unsafe(template));
    }
  });
};
