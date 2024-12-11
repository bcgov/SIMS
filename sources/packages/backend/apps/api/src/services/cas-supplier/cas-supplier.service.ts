import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { StudentService } from "../../services";
import {
  CASSupplier,
  Student,
  SupplierAddress,
  SupplierStatus,
  User,
} from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";
import { STUDENT_NOT_FOUND } from "../../constants";
import { Repository } from "typeorm";
import { CASSupplierSharedService } from "@sims/services";

export const CAS_SUPPLIER_ALREADY_IN_PENDING_SUPPLIER_VERIFICATION =
  "CAS_SUPPLIER_ALREADY_IN_PENDING_SUPPLIER_VERIFICATION";

Injectable();
export class CASSupplierService {
  constructor(
    @InjectRepository(CASSupplier)
    private readonly casSupplierRepo: Repository<CASSupplier>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly studentService: StudentService,
    private readonly casSupplierSharedService: CASSupplierSharedService,
  ) {}

  /**
   * Gets CAS suppliers given a student id.
   * @param studentId the student id.
   * @returns CAS suppliers for the given student.
   */
  async getCASSuppliers(studentId: number): Promise<CASSupplier[]> {
    return this.casSupplierRepo.find({
      select: {
        id: true,
        createdAt: true,
        status: true,
        supplierNumber: true,
        supplierProtected: true,
        supplierStatus: true,
        isValid: true,
        supplierAddress: true as unknown,
        errors: true,
      },
      where: {
        student: { id: studentId },
      },
      order: {
        createdAt: "DESC",
      },
    });
  }

  /**
   * Saves manual CAS supplier information.
   * @param studentId student id for the CAS supplier information.
   * @param supplierNumber supplier number.
   * @param supplierSiteCode supplier site code.
   * @param auditUserId user id for the record creation.
   * @returns the saved CAS supplier.
   */
  async addCASSupplier(
    studentId: number,
    supplierNumber: string,
    supplierSiteCode: string,
    auditUserId: number,
  ): Promise<CASSupplier> {
    const student = await this.studentService.getStudentById(studentId);
    if (!student) {
      throw new CustomNamedError("Student not found.", STUDENT_NOT_FOUND);
    }
    const now = new Date();
    const auditUser = { id: auditUserId } as User;

    // Create manual verified CAS Supplier.
    const manualVerifiedSupplier = new CASSupplier();
    manualVerifiedSupplier.student = student;
    manualVerifiedSupplier.supplierNumber = supplierNumber;
    manualVerifiedSupplier.lastUpdated = now;
    manualVerifiedSupplier.supplierAddress = {
      supplierSiteCode,
    } as SupplierAddress;
    manualVerifiedSupplier.supplierStatus = SupplierStatus.VerifiedManually;
    manualVerifiedSupplier.supplierStatusUpdatedOn = now;
    manualVerifiedSupplier.isValid = true;
    manualVerifiedSupplier.createdAt = now;
    manualVerifiedSupplier.creator = auditUser;
    manualVerifiedSupplier.studentProfileSnapshot =
      this.casSupplierSharedService.getStudentProfileSnapshot(
        student.user.firstName,
        student.user.lastName,
        student.sinValidation.sin,
        student.contactInfo.address,
      );

    // Set manual verified CAS Supplier for the student.
    student.casSupplier = manualVerifiedSupplier;
    student.updatedAt = now;
    student.modifier = auditUser;

    // Save student with manual verified CAS Supplier.
    await this.studentRepo.save(student);

    return student.casSupplier;
  }

  /**
   * Retries CAS supplier info for a student.
   * Inserts a new CAS Supplier record for the student with {@link SupplierStatus.PendingSupplierVerification} status.
   * @param studentId student id.
   * @param auditUserId user id for the record creation.
   * @returns the created CAS Supplier.
   */
  async retryCASSupplier(
    studentId: number,
    auditUserId: number,
  ): Promise<CASSupplier> {
    const student = await this.studentRepo.findOne({
      select: {
        id: true,
        casSupplier: {
          id: true,
          supplierStatus: true,
        },
      },
      relations: {
        casSupplier: true,
      },
      where: {
        id: studentId,
      },
    });
    if (!student) {
      throw new CustomNamedError("Student not found.", STUDENT_NOT_FOUND);
    }
    if (
      student.casSupplier?.supplierStatus ===
      SupplierStatus.PendingSupplierVerification
    ) {
      throw new CustomNamedError(
        `There is already a CAS Supplier for this student in ${SupplierStatus.PendingSupplierVerification} status.`,
        CAS_SUPPLIER_ALREADY_IN_PENDING_SUPPLIER_VERIFICATION,
      );
    }
    const savedStudent = await this.studentService.createPendingCASSupplier(
      studentId,
      auditUserId,
    );
    return savedStudent.casSupplier;
  }
}
