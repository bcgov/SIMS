import { AuditEvent } from "../../../services";
import { IsEnum } from "class-validator";

export class AuditAPIInDTO {
  @IsEnum(AuditEvent)
  event: AuditEvent;
}
