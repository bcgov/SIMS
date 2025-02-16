import HttpBaseClient from "./common/HttpBaseClient";

export class QueuesDashboardApi extends HttpBaseClient {
  async authenticate(): Promise<void> {
    await this.postCallFullResponse(
      this.addClientRoot("queues-dashboard/authenticate"),
      null,
      { withCredentials: true },
    );
  }
}
