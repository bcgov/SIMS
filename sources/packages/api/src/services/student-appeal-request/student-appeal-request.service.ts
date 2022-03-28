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
   * @param appealStatus appeal status that to be searched for.
   * @param isEqual, this flag decides how the requested status should checked,
   * eg, If isEqual is true, then the logic will check if the requested appealStatus
   * is equal to appealStatus of the selected row.
   * If isEqual is false, then the logic will check if the requested appealStatus
   * is not equal to appealStatus of the selected row.
   * By default isEqual is true.
   * @returns 'select' query that could be used in an 'exists' or
   * 'not exists'.
   */
  appealsByStatusQueryObject(
    appealStatus: StudentAppealStatus,
    isEqual = true,
  ): SelectQueryBuilder<StudentAppealRequest> {
    const queryObject = this.repo
      .createQueryBuilder("studentAppealRequest")
      .select("1")
      .andWhere("studentAppealRequest.studentAppeal = studentAppeal.id");
    if (isEqual) {
      queryObject.andWhere(
        `studentAppealRequest.appealStatus = '${appealStatus}'`,
      );
    } else {
      queryObject.andWhere(
        `studentAppealRequest.appealStatus != '${appealStatus}'`,
      );
    }
    return queryObject;
  }
}
