import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection, SelectQueryBuilder } from "typeorm";
import {
  StudentAppealRequest,
  StudentAppealStatus,
} from "../../database/entities";

@Injectable()
export class StudentAppealRequestsService extends RecordDataModelService<StudentAppealRequest> {
  constructor(connection: Connection) {
    super(connection.getRepository(StudentAppealRequest));
  }
  /**
   * Creates a 'select' query that could be used in an 'exists' or
   * 'not exists' where clause.
   * @param appealStatus student request status that to be searched for.
   * @param isEqual, this flag decides how the passed status should checked,
   * eg, if isEqual is true, then the logic will check if the passed status
   * is equal to appealStatus.
   * if isEqual is false, then the logic will check if the passed status
   * is not equal to appealStatus.
   * by default isEqual is true.
   * @returns 'select' query that could be used in an 'exists' or
   * 'not exists'.
   */
  getExistsAppeals(
    appealStatus: StudentAppealStatus,
    isEqual = true,
  ): SelectQueryBuilder<StudentAppealRequest> {
    const query = this.repo
      .createQueryBuilder("studentAppealRequest")
      .select("1")
      .andWhere("studentAppealRequest.studentAppeal = studentAppeal.id");
    if (isEqual) {
      query.andWhere(`studentAppealRequest.appealStatus = '${appealStatus}'`);
    } else {
      query.andWhere(`studentAppealRequest.appealStatus != '${appealStatus}'`);
    }
    return query;
  }
}
