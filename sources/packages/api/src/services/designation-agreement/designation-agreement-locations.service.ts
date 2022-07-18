import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { DataSource, SelectQueryBuilder } from "typeorm";
import {
  DesignationAgreementLocation,
  DesignationAgreementStatus,
} from "../../database/entities";

/**
 * Manages the operations needed for designation agreements location.
 */
@Injectable()
export class DesignationAgreementLocationService extends RecordDataModelService<DesignationAgreementLocation> {
  constructor(private readonly dataSource: DataSource) {
    super(dataSource.getRepository(DesignationAgreementLocation));
  }

  /**
   * Creates a 'select' query that could be used in an 'exists' or
   * 'not exists' where clause to define if the location is designated
   * or not.
   * ! This query will assume that a join to 'institution_location.id' is present
   * ! in the master query.
   * @returns 'select' query that could be used in an 'exists' or
   * 'not exists'.
   */
  getExistsDesignatedLocation(): SelectQueryBuilder<DesignationAgreementLocation> {
    return this.repo
      .createQueryBuilder("designationAgreementLocation")
      .select("1")
      .innerJoin(
        "designationAgreementLocation.designationAgreement",
        "designationAgreement",
      )
      .where(
        `designationAgreement.designationStatus = '${DesignationAgreementStatus.Approved}'`,
      )
      .andWhere("designationAgreementLocation.approved = true")
      .andWhere(
        "NOW() BETWEEN designationAgreement.startDate AND designationAgreement.endDate",
      )
      .andWhere(
        "designationAgreementLocation.institutionLocation = location.id",
      );
  }
}
