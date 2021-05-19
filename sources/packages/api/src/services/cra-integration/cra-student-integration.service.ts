import { Injectable, Scope } from "@nestjs/common";
import { CraIntegrationService, StudentService } from "..";
import { CraPersonRecord } from "./cra-integration.models";

@Injectable({ scope: Scope.TRANSIENT })
export class CraStudentIntegrationService {
  constructor(
    private readonly cra: CraIntegrationService,
    private readonly studentService: StudentService,
  ) {}

  public async createSinValidationRequest() {
    const students = await this.studentService.getStudentsPendingSinValidation();
    const craRecords = students.map((student) => {
      return {
        sin: student.sin,
        surname: student.user.lastName,
        givenName: student.user.lastName,
        birthDate: student.birthdate,
      } as CraPersonRecord;
    });

    const fileContent = this.cra.createMatchingRunContent(craRecords, 1);
    const fileName = this.cra.createRequestFileName(1);
    this.cra.uploadContent(fileContent, fileName);
  }
}
