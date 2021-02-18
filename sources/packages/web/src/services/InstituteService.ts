export interface Institute {
  name: string;
  code?: string;
}

export class InstituteService {
  // Share Instance
  private static instance: InstituteService;

  public static get shared(): InstituteService {
    return this.instance || (this.instance = new this());
  }

  public async getInstitutes(): Promise<Institute[]> {
    // TODO: Sending dummy list for now later replace with API call
    const institutes: Institute[] = [
      {
        name: "Sprott Shaw College",
        code: "ssc",
      },
    ];
    return institutes;
  }
}
