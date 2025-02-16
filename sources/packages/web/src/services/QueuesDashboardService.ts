import ApiClient from "@/services/http/ApiClient";

export class QueuesDashboardService {
  /**
   * Shared instance.
   */
  private static instance: QueuesDashboardService;

  static get shared(): QueuesDashboardService {
    return this.instance || (this.instance = new this());
  }

  async authenticate(): Promise<void> {
    await ApiClient.QueuesDashboardApi.authenticate();
  }
}
