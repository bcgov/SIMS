import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { OfferingIntensity } from ".";
import { TableNames } from "../constant";

/**
 * Errors that can be received in the e-Cert feedback file.
 */
@Entity({ name: TableNames.ECertFeedbackErrors })
export class ECertFeedbackError {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Error code.
   */
  @Column({
    name: "error_code",
  })
  errorCode: string;

  /**
   * Error description.
   */
  @Column({
    name: "error_description",
  })
  errorDescription: string;

  /**
   * Offering intensity of the error. Errors are distinct to offering intensity.
   */
  @Column({
    name: "offering_intensity",
  })
  offeringIntensity: OfferingIntensity;

  /**
   * Indicates if the error will block the funding.
   */
  @Column({
    name: "block_funding",
    nullable: false,
  })
  blockFunding: boolean;
}
