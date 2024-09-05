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
  ): Promise<CASSupplierInfoAPIOutDTO[]> {
    return await ApiClient.CASSupplier.getCASSupplierInfo(studentId);
  }

  /**
   * Adds CAS Supplier info.
   * @param studentId student id.
   * @param casSupplierInfo CAS supplier info.

   */
  async addCASSupplier(
    studentId: number,
    casSupplierInfo: AddCASSupplierAPIInDTO,
  ) {
    await ApiClient.CASSupplier.addCASSupplierInfo(studentId, casSupplierInfo);
  }
}
