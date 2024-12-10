import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
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
import { CASSupplierService, StudentService } from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { STUDENT_NOT_FOUND } from "../../constants";
import { CustomNamedError } from "@sims/utilities";

/**
 * CAS supplier controller.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("cas-supplier")
@ApiTags(`${ClientTypeBaseRoute.AEST}-cas-supplier`)
export class CASSupplierAESTController extends BaseController {
  constructor(
    private readonly casSupplierService: CASSupplierService,
    private readonly studentService: StudentService,
  ) {
    super();
  }

  /**
   * Gets CAS suppliers for a given student.
   * @param studentId student id to retrieve CAS suppliers.
   * @return a list of CAS supplier info.
   */
  @Get("student/:studentId")
  @ApiNotFoundResponse({
    description: "Student not found.",
  })
  async getCASSuppliers(
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<CASSupplierInfoAPIOutDTO> {
    const studentExist = await this.studentService.studentExists(studentId);
    if (!studentExist) {
      throw new NotFoundException("Student not found.");
    }
    const casSuppliers = await this.casSupplierService.getCASSuppliers(
      studentId,
    );
    const casSupplierInfoDTOList = casSuppliers.map((casSupplier) => ({
      id: casSupplier.id,
      dateCreated: casSupplier.createdAt,
      status: casSupplier.status,
      supplierNumber: casSupplier.supplierNumber,
      supplierProtected: casSupplier.supplierProtected,
      supplierStatus: casSupplier.supplierStatus,
      isValid: casSupplier.isValid,
      supplierSiteCode: casSupplier.supplierAddress?.supplierSiteCode,
      addressLine1: casSupplier.supplierAddress?.addressLine1,
      siteStatus: casSupplier.supplierAddress?.status,
      siteProtected: casSupplier.supplierAddress?.siteProtected,
      errors: casSupplier?.errors,
    }));
    return { items: casSupplierInfoDTOList };
  }

  /**
   * Adds a CAS supplier manually.
   * @param payload CAS supplier to be added.
   * @param studentId student id related to the CAS supplier.
   */
  @Roles(Role.AESTEditCASSupplierInfo)
  @Post("student/:studentId")
  @ApiNotFoundResponse({
    description: "Student not found.",
  })
  async addCASSupplier(
    @Body() payload: AddCASSupplierAPIInDTO,
    @Param("studentId", ParseIntPipe) studentId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    try {
      const casSupplier = await this.casSupplierService.addCASSupplier(
        studentId,
        payload.supplierNumber,
        payload.supplierSiteCode,
        userToken.userId,
      );
      return { id: casSupplier.id };
    } catch (error: unknown) {
      if (
        error instanceof CustomNamedError &&
        error.name === STUDENT_NOT_FOUND
      ) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
