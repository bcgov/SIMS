import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection, SelectQueryBuilder } from "typeorm";
import {
  StudentAppealRequest,
  StudentAppealStatus,
} from "../../database/entities";

// TODO: FUNCTION IN THIS FILE WILL ME MOVED TO CORRECTED SERVICE, WHEN FRONTEND CODE IS MERGED
@Injectable()
export class StudentAppealRequestsService extends RecordDataModelService<StudentAppealRequest> {
  constructor(connection: Connection) {
    super(connection.getRepository(StudentAppealRequest));
  }
  // todo: update comment
  /**
   * Creates a 'select' query that could be used in an 'exists' or
   * 'not exists' where clause.
   * ! This query will assume that a join to 'studentAppeal.application' is present
   * ! in the master query.
   * @returns 'select' query that could be used in an 'exists' or
   * 'not exists'.
   */
  getExistsAppeals(
    appealStatus: StudentAppealStatus,
  ): SelectQueryBuilder<StudentAppealRequest> {
    return this.repo
      .createQueryBuilder("studentAppealRequest")
      .select("1")
      .andWhere(`studentAppealRequest.appealStatus = ${appealStatus}`)
      .andWhere("studentAppealRequest.studentAppeal = studentAppeal");
  }

  getExistsAppeals1(
    appealStatus: StudentAppealStatus,
    isEqual = true,
  ): SelectQueryBuilder<StudentAppealRequest> {
    const q = this.repo
      .createQueryBuilder("studentAppealRequest")
      .select("1")
      .andWhere("studentAppealRequest.studentAppeal = studentAppeal.id");
    if (isEqual) {
      q.andWhere(`studentAppealRequest.appealStatus = '${appealStatus}'`);
    } else {
      q.andWhere(`studentAppealRequest.appealStatus != '${appealStatus}'`);
    }
    return q;
  }
}
