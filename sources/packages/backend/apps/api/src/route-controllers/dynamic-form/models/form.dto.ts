import { JSON_200KB } from "../../../constants";
import { JsonMaxSize } from "../../../utilities/class-validation";
import { IsObject, MaxLength } from "class-validator";

export class FormPathParamAPIInDTO {
  @MaxLength(200)
  formPath: string;
}

export class FormUpdateAPIInDTO {
  @IsObject()
  @JsonMaxSize(JSON_200KB)
  formDefinition: unknown;
}

export class FormAPIOutDTO {
  title: string;
  path: string;
}

export class FormsAPIOutDTO {
  forms: FormAPIOutDTO[];
}
