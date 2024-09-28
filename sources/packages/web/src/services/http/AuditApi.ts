import HttpBaseClient from "./common/HttpBaseClient";

export class AuditApi extends HttpBaseClient {
  public async audit(event: string): Promise<any> {
    return this.postCall(`audit/${event}`, null);
  }
}
