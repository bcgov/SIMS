import HttpBaseClient from "./common/HttpBaseClient";
import {
  AddCASSupplierAPIInDTO,
  CASSupplierInfoAPIOutDTO,
} from "@/services/http/dto/CASSupplier.dto";

export class CASSupplierApi extends HttpBaseClient {
  async getCASSupplierInfo(
    studentId: number,
  ): Promise<CASSupplierInfoAPIOutDTO[]> {
    return this.getCall<CASSupplierInfoAPIOutDTO[]>(
      this.addClientRoot(`cas-supplier/student/${studentId}`),
    );
  }

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
