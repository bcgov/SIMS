import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  CASSupplier,
  Student,
  SupplierAddress,
  SupplierStatus,
  User,
} from "@sims/sims-db";
import { Repository } from "typeorm";

Injectable();
export class CASSupplierService {
  constructor(
    @InjectRepository(CASSupplier)
    private readonly casSupplierRepo: Repository<CASSupplier>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  /**
   * Gets CAS suppliers given a student id.
   * @param studentId the student id.
   * @returns CAS suppliers for the given student.
   */
  async getCASSuppliers(studentId: number): Promise<CASSupplier[]> {
    return this.casSupplierRepo.find({
      select: {
        createdAt: true,
        supplierNumber: true,
        supplierProtected: true,
        supplierStatus: true,
        isValid: true,
        supplierAddress: true as unknown,
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
    const now = new Date();
    const auditUser = { id: auditUserId } as User;
    const student = { id: studentId } as Student;

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

    // Set manual verified CAS Supplier for the student.
    student.casSupplier = manualVerifiedSupplier;
    student.updatedAt = now;
    student.modifier = auditUser;

    // Save student with manual verified CAS Supplier.
    await this.studentRepo.save(student);

    return student.casSupplier;
  }
}
