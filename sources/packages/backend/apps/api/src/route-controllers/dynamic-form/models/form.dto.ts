import { JSON_200KB } from "../../../constants";
import { JsonMaxSize } from "../../../utilities/class-validation";
import { IsObject, MaxLength } from "class-validator";

export class FormNameParamAPIInDTO {
  @MaxLength(200)
  formName: string;
}

export class FormUpdateAPIInDTO {
  @IsObject()
  @JsonMaxSize(JSON_200KB)
  formDefinition: unknown;
}

export class FormAPIOutDTO {
  title: string;
  name: string;
}

export class FormsAPIOutDTO {
  forms: FormAPIOutDTO[];
}
