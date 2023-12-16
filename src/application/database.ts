import {
  createBigintTypeParser,
  createDateTypeParser,
  createIntervalTypeParser,
  createNumericTypeParser,
  createPool,
  DatabasePool,
  Field,
} from 'slonik';
import { createFieldNameTransformationInterceptor } from 'slonik-interceptor-field-name-transformation';

const configuration = {
  interceptors: [
    createFieldNameTransformationInterceptor({
      format: 'CAMEL_CASE',
      test: (field: Field) => {
        return field.name !== '__typename' && /^[\d_a-z]+$/u.test(field.name);
      },
    }),
  ],
  typeParsers: [
    createDateTypeParser(),
    createBigintTypeParser(),
    createIntervalTypeParser(),
    createNumericTypeParser(),
  ],
};

export const createDatabasePool = async (
  connectionUri: string,
): Promise<DatabasePool> => {
  return await createPool(connectionUri, {
    ...configuration,
    connectionTimeout: 5_000,
    maximumPoolSize: 1,
  });
};
