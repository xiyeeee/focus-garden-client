import type { CsrfVO } from "./auth/types";
export const createCsrfManager = (load: () => Promise<CsrfVO>) => {
  let value: CsrfVO | null = null;
  let pending: Promise<CsrfVO> | null = null;
  let generation = 0;
  const clear = () => {
    generation++;
    value = null;
    pending = null;
  };
  const get = (): Promise<CsrfVO> => {
    if (value) return Promise.resolve(value);
    if (pending) return pending;
    const current = generation;
    const request = load()
      .then((token) => {
        if (current !== generation) return get();
        value = token;
        return token;
      })
      .finally(() => {
        if (pending === request) pending = null;
      });
    pending = request;
    return request;
  };
  return {
    get,
    clear,
    refresh: () => {
      clear();
      return get();
    },
  };
};
