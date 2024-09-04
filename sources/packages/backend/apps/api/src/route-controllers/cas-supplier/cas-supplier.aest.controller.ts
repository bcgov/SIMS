import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthorizedParties, IUserToken, Role, UserGroups } from "../../auth";
import {
  AllowAuthorizedParty,
  Groups,
  Roles,
  UserToken,
} from "../../auth/decorators";
import BaseController from "../BaseController";
import {
  AddCASSupplierAPIInDTO,
  CASSupplierInfoAPIOutDTO,
} from "./models/cas-supplier.dto";
import { CASSupplierService } from "../../services";
import { ClientTypeBaseRoute } from "../../types";

/**
 * CAS supplier controller.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("cas-supplier")
@ApiTags(`${ClientTypeBaseRoute.AEST}-cas-supplier`)
export class CASSupplierAESTController extends BaseController {
  constructor(private readonly casSupplierService: CASSupplierService) {
    super();
  }

  /**
   * Gets CAS suppliers for a given student.
   * @param studentId student id to retrieve CAS suppliers.
   * @return a list of CAS supplier info.
   */
  @Get("student/:studentId")
  async getCASSuppliers(
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<CASSupplierInfoAPIOutDTO[]> {
    const casSuppliers = await this.casSupplierService.getCASSuppliers(
      studentId,
    );
    const casSupplierInfoDTOList = [];
    for (const casSupplier of casSuppliers) {
      const casSupplierAPIOutDTO = new CASSupplierInfoAPIOutDTO();
      casSupplierAPIOutDTO.dateCreated = casSupplier.createdAt;
      casSupplierAPIOutDTO.supplierNumber = casSupplier.supplierNumber;
      casSupplierAPIOutDTO.supplierProtected = casSupplier.supplierProtected;
      casSupplierAPIOutDTO.supplierStatus = casSupplier.supplierStatus;
      casSupplierAPIOutDTO.isValid = casSupplier.isValid;
      casSupplierAPIOutDTO.supplierSiteCode =
        casSupplier.supplierAddress?.supplierSiteCode;
      casSupplierAPIOutDTO.addressLine1 =
        casSupplier.supplierAddress?.addressLine1;
      casSupplierAPIOutDTO.siteStatus = casSupplier.supplierAddress?.status;
      casSupplierAPIOutDTO.siteProtected =
        casSupplier.supplierAddress?.siteProtected;
      casSupplierInfoDTOList.push(casSupplierAPIOutDTO);
    }
    return casSupplierInfoDTOList;
  }

  /**
   * Adds a CAS supplier manually.
   * @param payload CAS supplier to be added.
   * @param studentId student id related to the CAS supplier.
   */
  @Roles(Role.AESTEditCASSupplierInfo)
  @Post("student/:studentId")
  async addCASSupplier(
    @Body() payload: AddCASSupplierAPIInDTO,
    @Param("studentId", ParseIntPipe) studentId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    await this.casSupplierService.addCASSupplier(
      studentId,
      payload.supplierNumber,
      payload.supplierSiteCode,
      userToken.userId,
    );
  }
}
