import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CASSupplier, SupplierStatus } from "@sims/sims-db";
import { Repository } from "typeorm";

Injectable();
export class CASSupplierService {
  constructor(
    @InjectRepository(CASSupplier)
    private readonly casSupplierRepo: Repository<CASSupplier>,
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
   * @param creatorUserId user id for the record creation.
   * @returns the saved CAS supplier.
   */
  async addCASSupplier(
    studentId: number,
    supplierNumber: string,
    supplierSiteCode: string,
    creatorUserId: number,
  ): Promise<CASSupplier> {
    const now = new Date();
    return this.casSupplierRepo.save({
      student: { id: studentId },
      supplierNumber: supplierNumber,
      lastUpdated: now,
      supplierAddress: {
        supplierSiteCode: supplierSiteCode,
      },
      supplierStatus: SupplierStatus.VerifiedManually,
      supplierStatusUpdatedOn: now,
      isValid: true,
      createdAt: now,
      creator: { id: creatorUserId },
    });
  }
}
