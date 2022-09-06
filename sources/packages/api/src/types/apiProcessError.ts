export class ApiProcessError<T = unknown> {
  constructor(
    public readonly message: string,
    public readonly errorType: string,
    public readonly objectInfo?: T,
  ) {}
}
