import HttpBaseClient from "./common/HttpBaseClient";

export interface StudentProfile {
  phone: string;
  sinNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
}

export class StudentApi extends HttpBaseClient {
  public async createStudent(studentProfile: StudentProfile): Promise<void> {
    try {
      await this.apiClient.post(
        "students",
        studentProfile,
        this.addAuthHeader()
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
