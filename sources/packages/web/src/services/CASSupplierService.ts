import ApiClient from "@/services/http/ApiClient";
import {
  AddCASSupplierAPIInDTO,
  CASSupplierInfoAPIOutDTO,
} from "@/services/http/dto";

export class CASSupplierService {
  // Share Instance
  private static instance: CASSupplierService;

  public static get shared(): CASSupplierService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Gets supplier info by student id.
   * @param studentId student id.
   * @returns CAS supplier info.
   */
  async getSupplierInfoByStudentId(
    studentId: number,
  ): Promise<CASSupplierInfoAPIOutDTO> {
    return ApiClient.CASSupplier.getCASSupplierInfo(studentId);
  }

  /**
   * Retries CAS Supplier info for a student.
   * @param studentId student id.
   */
  async retryCASSupplier(studentId: number): Promise<void> {
    return ApiClient.CASSupplier.retryCASSupplier(studentId);
  }

  /**
   * Adds CAS Supplier info.
   * @param studentId student id.
   * @param casSupplierInfo CAS supplier info.
   */
  async addCASSupplier(
    studentId: number,
    casSupplierInfo: AddCASSupplierAPIInDTO,
  ): Promise<void> {
    return ApiClient.CASSupplier.addCASSupplierInfo(studentId, casSupplierInfo);
  }
}
