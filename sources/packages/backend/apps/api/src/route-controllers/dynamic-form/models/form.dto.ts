import { MaxLength } from "class-validator";

export class FormNameParamAPIInDTO {
  @MaxLength(200)
  formName: string;
}

export class FormAPIOutDTO {
  title: string;
  name: string;
}

export class FormsAPIOutDTO {
  forms: FormAPIOutDTO[];
}
