import { Injectable } from "@nestjs/common";
import Ajv from "ajv";
import { EducationProgramService } from "../../education-program.service";
import { EducationProgramDataValidationContext } from "./custom-validators.models";

/**
 * AJV custom async keyword ensuring the SABC code is not used by another
 * active program of the same institution for the same program year.
 * Declared in the configuration validation schema, which is shared with the
 * client form, where it is ignored since it depends on server-side information.
 */
export const SABC_CODE_UNIQUE_KEYWORD = "sabcCodeUnique";

/**
 * AJV custom async keyword validator ensuring the SABC code is not used by
 * another active program of the same institution for the same program year.
 */
@Injectable()
export class UniqueSABCValidator {
  constructor(
    private readonly educationProgramService: EducationProgramService,
  ) {}

  /**
   * Adds the async keyword that ensures the SABC code is not used by another
   * active program of the same institution, expecting the
   * {@link EducationProgramDataValidationContext} as the validation context.
   * @param ajv AJV instance to receive the keyword.
   */
  addKeyword(ajv: Ajv): void {
    const educationProgramService = this.educationProgramService;
    ajv.addKeyword({
      keyword: SABC_CODE_UNIQUE_KEYWORD,
      async: true,
      type: "string",
      schemaType: "boolean",
      validate: async function (
        this: EducationProgramDataValidationContext,
        shouldValidate: boolean,
        sabcCode: string,
      ): Promise<boolean> {
        // Empty SABC codes are saved as null and can be shared between programs.
        if (!shouldValidate || !sabcCode.trim()) {
          return true;
        }
        const isDuplicate =
          await educationProgramService.hasExistingProgramWithSameSABCCode(
            this.institutionId,
            sabcCode.trim(),
            this.programYearId,
            this.programId,
          );
        if (isDuplicate) {
          throw new Ajv.ValidationError([
            { keyword: SABC_CODE_UNIQUE_KEYWORD },
          ]);
        }
        return true;
      },
    });
  }
}
