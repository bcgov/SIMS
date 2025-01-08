export class ApplicationDataChange {
  constructor(
    readonly key?: string,
    readonly newValue?: unknown,
    readonly oldValue?: unknown,
    readonly index?: number,
  ) {
    this.changes = [];
  }
  itemsRemoved?: boolean;
  changes: ApplicationDataChange[];
}
