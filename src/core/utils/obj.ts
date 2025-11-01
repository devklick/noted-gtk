type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

export function keys<T extends object>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>;
}

export function freezeDeep<T>(obj: T) {
  // @ts-expect-error
  Object.values(obj).forEach(
    (value) => Object.isFrozen(value) || freezeDeep(value)
  );
  return Object.freeze(obj) as DeepReadonly<T>;
}

export default {
  keys,
  freezeDeep,
};
