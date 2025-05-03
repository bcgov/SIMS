export interface FormAPIOutDTO {
  title: string;
  name: string;
}

export interface FormsAPIOutDTO {
  forms: FormAPIOutDTO[];
}

export interface FormUpdateAPIInDTO {
  formDefinition: unknown;
}
