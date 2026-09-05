import { Institution } from "@sims/sims-db";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { EducationProgramFieldOfStudyCodeEvaluator } from "./education-program-field-of-study-code-evaluator";
import { EducationProgramStatusEvaluator } from "./education-program-status-evaluator";
import { EducationProgramBaseEvaluator } from "./education-program-base-evaluator";
import {
  ProgramEvaluationContext,
  ProgramCalculatedDataKey,
  ProgramEvaluationData,
  ProgramEvaluationResult,
} from "../education-program.service.models";
import { Injectable } from "@nestjs/common";

@Injectable()
export class EducationProgramEvaluationService {
  private readonly evaluators: EducationProgramBaseEvaluator<unknown>[];
  constructor(
    @InjectRepository(Institution)
    private readonly institutionRepo: Repository<Institution>,
    educationProgramFieldOfStudyCodeEvaluator: EducationProgramFieldOfStudyCodeEvaluator,
    educationProgramStatusEvaluator: EducationProgramStatusEvaluator,
  ) {
    this.evaluators = [
      educationProgramFieldOfStudyCodeEvaluator,
      educationProgramStatusEvaluator,
    ];
  }
  /**
   * Evaluates the education program based on the provided institution ID, calculated data keys, and evaluation data.
   * @param institutionId The ID of the program institution.
   * @param calculatedDataKeys The keys of the calculated data to evaluate.
   * @param data The partial evaluation data for the program.
   * @returns The result of the program evaluation.
   */
  async evaluate(
    institutionId: number,
    calculatedDataKeys: ProgramCalculatedDataKey[],
    data: Partial<ProgramEvaluationData>,
  ): Promise<ProgramEvaluationResult> {
    const institution = await this.institutionRepo.findOne({
      select: { id: true, institutionType: { id: true } },
      where: { id: institutionId },
    });
    if (!institution) {
      throw new Error(`Institution with ID ${institutionId} not found.`);
    }
    const context: ProgramEvaluationContext = {
      isBCPublic: institution.institutionType.isBCPublic,
      isBCPrivate: institution.institutionType.isBCPrivate,
    };
    const evaluationResult: ProgramEvaluationResult = {};
    calculatedDataKeys.forEach((key) => {
      const calculatedDataEvaluator = this.evaluators.find(
        (item) => item.key === key,
      );
      if (!calculatedDataEvaluator) {
        throw new Error(`No evaluator found for the key: ${key}`);
      }
      evaluationResult[key] = calculatedDataEvaluator.evaluate(
        data,
        context,
      ) as never;
    });
    return evaluationResult;
  }
}
