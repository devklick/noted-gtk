type CamelToSnake<T extends string> = T extends `${infer Head}${infer Tail}`
  ? Tail extends Uncapitalize<Tail>
    ? `${Lowercase<Head>}${CamelToSnake<Tail>}`
    : `_${Lowercase<Head>}${CamelToSnake<Tail>}`
  : T;

type PascalCase<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Capitalize<Lowercase<Head>>}${PascalCase<Tail>}`
  : S extends `${infer Head}-${infer Tail}`
  ? `${Capitalize<Lowercase<Head>>}${PascalCase<Tail>}`
  : S extends `${infer Head} ${infer Tail}`
  ? `${Capitalize<Lowercase<Head>>}${PascalCase<Tail>}`
  : Capitalize<Lowercase<S>>;

export function toUppercase<T extends string>(value: T): Uppercase<T> {
  return value.toUpperCase() as Uppercase<T>;
}

export function toPascalCase<T extends string>(text: T): PascalCase<T> {
  return text
    .replace(/[_\- ]+/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("") as PascalCase<T>;
}

export default {
  upper: toUppercase,
  pascal: toPascalCase,
};
