import * as dayjs from "dayjs";
import { EXTENDED_DATE_FORMAT } from "../../utilities/constants";
export class EducationProgramOfferingModel {
  id: number;
  name: string;
  studyStartDate: Date;
  studyEndDate: Date;
  offeringDelivered: string;
  get studyDates(): string {
    if (this.studyStartDate === null) {
      return "No program dates";
    } else {
      return `${dayjs(this.studyStartDate).format(
        EXTENDED_DATE_FORMAT,
      )} - ${dayjs(this.studyEndDate).format(EXTENDED_DATE_FORMAT)}`;
    }
  }
}
