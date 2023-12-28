import { randomInt as cryptoRandomInt } from 'node:crypto';

export const randomInt = (): number => {
  return cryptoRandomInt(99_999_999);
};

export const randomString = (): string => {
  return Math.random().toString(36).slice(7);
};
