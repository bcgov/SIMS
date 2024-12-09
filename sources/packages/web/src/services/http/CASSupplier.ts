import HttpBaseClient from "./common/HttpBaseClient";
import {
  AddCASSupplierAPIInDTO,
  CASSupplierInfoAPIOutDTO,
} from "@/services/http/dto";

/**
 * Http API client for CAS suppliers.
 */
export class CASSupplierApi extends HttpBaseClient {
  /**
   * Gets CAS supplier info for a student.
   * @param studentId student id.
   * @returns CAS supplier info.
   */
  async getCASSupplierInfo(
    studentId: number,
  ): Promise<CASSupplierInfoAPIOutDTO> {
    return this.getCall<CASSupplierInfoAPIOutDTO>(
      this.addClientRoot(`cas-supplier/student/${studentId}`),
    );
  }

  /**
   * Retries CAS supplier info for a student.
   * @param studentId student id.
   */
  async retryCASSupplier(studentId: number): Promise<void> {
    await this.postCall(
      this.addClientRoot(`cas-supplier/retry/${studentId}`),
      null,
    );
  }

  /**
   * Adds CAS supplier info for a student.
   * @param studentId student id.
   * @param payload payload with the CAS supplier info.
   */
  async addCASSupplierInfo(
    studentId: number,
    payload: AddCASSupplierAPIInDTO,
  ): Promise<void> {
    await this.postCall(
      this.addClientRoot(`cas-supplier/student/${studentId}`),
      payload,
    );
  }
}
