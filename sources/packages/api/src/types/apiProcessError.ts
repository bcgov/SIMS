export class ApiProcessError {
  constructor(
    public readonly message: string,
    public readonly errorType: string,
  ) {}
}
