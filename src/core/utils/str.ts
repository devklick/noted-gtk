type CamelToSnake<T extends string> = T extends `${infer Head}${infer Tail}`
  ? Tail extends Uncapitalize<Tail>
    ? `${Lowercase<Head>}${CamelToSnake<Tail>}`
    : `_${Lowercase<Head>}${CamelToSnake<Tail>}`
  : T;

export function toUppercase<T extends string>(value: T): Uppercase<T> {
  return value.toUpperCase() as Uppercase<T>;
}

export default {
  upper: toUppercase,
};
