import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { StudentRestrictionSummary } from "@/types/contracts/RestrictionContract";

/**
 * Http API client for Restrictions.
 */
export class RestrictionApi extends HttpBaseClient {
  public async getStudentRestrictions(
    studentId: number,
  ): Promise<StudentRestrictionSummary[]> {
    const studentNotes = await this.getCall(
      `restrictions/student/${studentId}`,
    );
    return studentNotes.data as StudentRestrictionSummary[];
  }
}
