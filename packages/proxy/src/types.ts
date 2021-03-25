import type { TestProvider } from './providers/test-provider';

export interface Contract<T> {
  address: string;
  contractFile: string;
  contract: (provider: TestProvider) => T;
}

export interface Contracts<T> {
  [key: string]: Contract<T>;
}

export interface ContractInstance<T> {
  identifier: string;
  contract: T;
}

export type ContractInstancesOld<T extends Contracts<M>, M> = {
  [Name in keyof T]: ReturnType<T[Name]['contract']>;
};

export type ContractInstances<T extends Contracts<M>, M> = {
  [Name in keyof T]: ContractInstance<ReturnType<T[Name]['contract']>>;
};
