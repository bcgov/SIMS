export class FormAPIOutDTO {
  title: string;
  path: string;
}

export interface FormsAPIOutDTO {
  forms: FormAPIOutDTO[];
}

export interface FormUpdateAPIInDTO {
  formDefinition: unknown;
}
