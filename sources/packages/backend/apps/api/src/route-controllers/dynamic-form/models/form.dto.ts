import { MaxLength } from "class-validator";

export class FormNameParamAPIInDTO {
  @MaxLength(200)
  formName: string;
}
