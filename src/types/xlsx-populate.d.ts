// xlsx-populate ships no types. This declares only the subset this project uses.
declare module "xlsx-populate" {
  interface Cell {
    value(data: unknown): Cell;
  }

  interface Sheet {
    cell(address: string): Cell;
  }

  interface OutputOptions {
    password?: string;
  }

  interface Workbook {
    sheet(indexOrName: number | string): Sheet;
    outputAsync(opts?: OutputOptions): Promise<Buffer>;
  }

  const XlsxPopulate: {
    fromBlankAsync(): Promise<Workbook>;
  };

  export default XlsxPopulate;
}
