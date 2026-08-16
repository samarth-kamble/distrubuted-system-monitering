import { AsyncLocalStorage } from 'async_hooks';

export const loggerStorage = new AsyncLocalStorage<string>();
