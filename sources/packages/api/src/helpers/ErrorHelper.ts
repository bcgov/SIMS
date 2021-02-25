export default class ErrorHelper {
  static throwError(errMsg: string) {
    throw new Error(errMsg);
  }
}
