import { FixedFormatFileLine } from "../../../services/ssh";

export class DefaultedStudentLoansFileFooter implements FixedFormatFileLine {
  getFixedFormat(): string {
    return "";
  }
}
