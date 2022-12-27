export class BCeIDDetailsAPIOutDTO {
  user: UserDetailsAPIOutDTO;
  institution: InstitutionLocationDetailsAPIOutDTO;
}

export class UserDetailsAPIOutDTO {
  guid: string;
  displayName: string;
  firstname: string;
  surname: string;
  email: string;
}

export class InstitutionLocationDetailsAPIOutDTO {
  guid: string;
  legalName: string;
}
