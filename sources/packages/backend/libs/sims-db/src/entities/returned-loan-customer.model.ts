import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { TableNames } from "../constant";
import { RecordDataModel } from "./record.model";

/**
 * Customer associated with returned loans.
 */
@Entity({ name: TableNames.ReturnedLoanCustomers })
export class ReturnedLoanCustomer extends RecordDataModel {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Customer number (Social Insurance Number).
   */
  @Column({
    name: "sin",
    type: "char",
  })
  sin: string;
  /**
   * Customer last name.
   */
  @Column({
    name: "last_name",
  })
  lastName: string;
  /**
   * Customer first name.
   */
  @Column({
    name: "first_name",
    nullable: true,
  })
  firstName?: string;
  /**
   * Customer middle names.
   */
  @Column({
    name: "middle_names",
    nullable: true,
  })
  middleNames?: string;
  /**
   * Customer initial name.
   */
  @Column({
    name: "initial_names",
    nullable: true,
  })
  initialNames?: string;
  /**
   * Customer birth date.
   */
  @Column({
    name: "date_of_birth",
    type: "date",
  })
  dateOfBirth: string;
  /**
   * Customer gender, validated against the system lookup
   * configuration for returned loan customer gender.
   */
  @Column({
    name: "gender",
  })
  gender: string;
  /**
   * Customer email.
   */
  @Column({
    name: "email",
    nullable: true,
  })
  email?: string;
  /**
   * The name that should appear on mail outs for this address.
   * This includes 'In Care Of' addresses.
   */
  @Column({
    name: "address_name",
    nullable: true,
  })
  addressName?: string;
  /**
   * Customer address line 1.
   */
  @Column({
    name: "address_line_1",
    nullable: true,
  })
  addressLine1?: string;
  /**
   * Customer address line 2.
   */
  @Column({
    name: "address_line_2",
    nullable: true,
  })
  addressLine2?: string;
  /**
   * Customer address city.
   */
  @Column({
    name: "city",
    nullable: true,
  })
  city?: string;
  /**
   * Customer address country code.
   */
  @Column({
    name: "country",
    nullable: true,
  })
  country?: string;
  /**
   * Customer address province code, validated against the system lookup
   * configuration for province. Applicable to Canadian address only.
   */
  @Column({
    name: "province_code",
    nullable: true,
  })
  provinceCode?: string;
  /**
   * Customer address postal code.
   */
  @Column({
    name: "postal_zip_code",
    nullable: true,
  })
  postalZipCode?: string;
  /**
   * Customer home phone number.
   */
  @Column({
    name: "home_phone",
    nullable: true,
  })
  homePhone?: string;
  /**
   * Customer other phone number (Business or overseas).
   */
  @Column({
    name: "other_phone",
    nullable: true,
  })
  otherPhone?: string;
  /**
   * Date that the address information was last updated.
   */
  @Column({
    name: "address_effective_date",
    type: "date",
    nullable: true,
  })
  addressEffectiveDate?: string;
  /**
   * The date when the address is no longer valid.
   */
  @Column({
    name: "address_end_date",
    type: "date",
    nullable: true,
  })
  addressEndDate?: string;
}
