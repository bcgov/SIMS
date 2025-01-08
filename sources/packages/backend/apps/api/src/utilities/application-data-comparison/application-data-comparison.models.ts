export class ApplicationChange {
  constructor(
    readonly key?: string,
    readonly newValue?: unknown,
    readonly oldValue?: unknown,
    readonly index?: number,
  ) {
    this.changes = [];
  }
  changes: ApplicationChange[];
}
