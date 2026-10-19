/** Values are always bound parameters; this tag does not support raw fragments. */
export type SQL = { text: string; params: unknown[] };
export function sql(strings: TemplateStringsArray, ...params: unknown[]): SQL {
  return {
    text: strings.reduce((query, part, index) => query + (index ? "$" + index : "") + part, ""),
    params,
  };
}
