import { IER12TestInputData } from "./data-inputs/data-inputs.models";

export class IER12TestInputDataBuilder {
  private readonly testInput: IER12TestInputData;

  constructor() {
    this.testInput = {} as IER12TestInputData;
  }

  build(): IER12TestInputData {
    return this.testInput;
  }
}
