import { AuditEvent } from "apps/api/src/services";
import { IsEnum } from "class-validator";

export class AuditAPIInDTO {
  @IsEnum(AuditEvent)
  event: AuditEvent;
}
