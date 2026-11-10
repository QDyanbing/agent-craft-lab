import { isCancelledError, useLockFn } from 'ahooks';

export default <Args extends unknown[]>(action: (...args: Args) => Promise<void>) =>
  useLockFn(async (...args: Args) => {
    try {
      await action(...args);
    } catch (error) {
      if (!isCancelledError(error)) throw error;
    }
  });
