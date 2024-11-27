import { ColumnNames, TableNames } from "@sims/sims-db/constant";
import { RecordDataModel } from "@sims/sims-db/entities/record.model";
import { Student, SupplierStatus } from "@sims/sims-db/entities";
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

/**
 * Student supplier information data from the integration with Corporate Accounting System (CAS).
 */
@Entity({ name: TableNames.CASSuppliers })
export class CASSupplier extends RecordDataModel {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Reference to student id in students table.
   */
  @OneToOne(() => Student, {
    eager: false,
    cascade: ["update"],
    nullable: false,
  })
  @JoinColumn({
    name: "student_id",
    referencedColumnName: ColumnNames.ID,
  })
  student: Student;

  /**
   * Supplier number received from CAS. null when no data was ever retrieved from CAS.
   */
  @Column({
    name: "supplier_number",
    nullable: true,
  })
  supplierNumber?: string;

  /**
   * Supplier name received from CAS. null when no data was ever retrieved from CAS.
   */
  @Column({
    name: "supplier_name",
    nullable: true,
  })
  supplierName?: string;

  /**
   * Supplier status received from CAS. null when no data was ever retrieved from CAS.
   */
  @Column({
    name: "status",
    nullable: true,
  })
  status?: CASSupplierRecordStatus;

  /**
   * Protected flag received from CAS which means the student profile was created by SFAS and
   * therefore no system other than SFAS can change it. null when no data was ever retrieved from CAS.
   */
  @Column({
    name: "supplier_protected",
    nullable: true,
  })
  supplierProtected?: boolean;

  /**
   * Date and time of the last update. null when no data was ever retrieved from CAS.
   */
  @Column({
    name: "last_updated",
    type: "timestamptz",
    nullable: true,
  })
  lastUpdated?: Date;

  /**
   * Supplier address from the CAS integrations.
   */
  @Column({
    name: "supplier_address",
    type: "jsonb",
    nullable: true,
  })
  supplierAddress?: SupplierAddress;

  /**
   * Indicates if the system should execute verification in the record calling some of the CAS integrations;
   * if the record represents manual entry and no actions are needed; or if no further verifications are needed.
   */
  @Column({
    name: "supplier_status",
    type: "enum",
    enum: SupplierStatus,
    enumName: "SupplierStatus",
  })
  supplierStatus: SupplierStatus;

  /**
   * Date when the column supplier_status was updated.
   */
  @Column({
    name: "supplier_status_updated_on",
    type: "timestamptz",
    nullable: false,
  })
  supplierStatusUpdatedOn: Date;

  /**
   * Indicates when the supplier is considered valid and an invoice can be generated using the information.
   */
  @Column({
    name: "is_valid",
    type: "boolean",
  })
  isValid: boolean;

  /**
   * Error messages from the CAS integrations.
   */
  @Column({
    name: "errors",
    nullable: true,
    array: true,
    type: "varchar",
  })
  errors?: string[];

  /**
   * Snapshot of the student profile details which is captured
   * when the CAS supplier is set to be active.
   */
  @Column({
    name: "student_profile_snapshot",
    type: "jsonb",
    nullable: true,
  })
  studentProfileSnapshot?: StudentProfileSnapshot;
}

export type CASSupplierRecordStatus = "ACTIVE" | "INACTIVE";
export type CASSupplierSiteStatus = "ACTIVE" | "INACTIVE";
export interface SupplierAddress {
  supplierSiteCode: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  provinceState?: string;
  country?: string;
  postalCode?: string;
  status?: CASSupplierSiteStatus;
  siteProtected?: string;
  lastUpdated: Date;
}
/**
 * Student profile snapshot information.
 */
interface StudentProfileSnapshot {
  givenName: string;
  lastName: string;
  sin: string;
  addressLine1: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}
