import { Injectable } from "@nestjs/common";
import {
  Application,
  InstitutionRestriction,
  OfferingIntensity,
  QueryAndParamsForExecution,
  RecordDataModelService,
  Restriction,
  RestrictionActionType,
} from "@sims/sims-db";
import {
  Brackets,
  DataSource,
  EntityManager,
  ObjectLiteral,
  Repository,
} from "typeorm";
import {
  AcceptAssessmentRestrictionsEvaluationResult,
  RestrictionCode,
} from "..";
import { InjectRepository } from "@nestjs/typeorm";

/**
 * Service layer for restrictions.
 */
@Injectable()
export class RestrictionSharedService extends RecordDataModelService<Restriction> {
  constructor(
    dataSource: DataSource,
    @InjectRepository(InstitutionRestriction)
    private readonly institutionRestrictionRepo: Repository<InstitutionRestriction>,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
  ) {
    super(dataSource.getRepository(Restriction));
  }

  /**
   * Fetch the restriction with requested restriction code.
   * @param restrictionCode restriction code.
   * @param entityManager optional entity manager to operate within a transaction.
   * @returns restriction.
   */
  async getRestrictionByCode(
    restrictionCode: RestrictionCode,
    entityManager?: EntityManager,
  ): Promise<Restriction> {
    const restrictionRepo =
      entityManager?.getRepository(Restriction) ?? this.repo;
    return restrictionRepo
      .createQueryBuilder("restriction")
      .select("restriction.id")
      .where("restriction.restrictionCode = :restrictionCode", {
        restrictionCode,
      })
      .getOne();
  }

  /**
   * Get the effective institution restrictions for the given institution, program and location.
   * @param institutionId institution id.
   * @param locationId location id.
   * @param options options to filter the restrictions.
   * - `programId` program id. It may not be provided if the program is not available yet,
   * for instance, during a PIR process.
   * - `restrictionCode` restriction code.
   * - `actionTypes` restriction action types.
   * - `limitOne` if true, the query will limit the result to one restriction only.
   * Useful to act similar to an existence check, without the need to fetch all restrictions.
   * @returns effective institution restrictions.
   */
  getEffectiveInstitutionRestrictions(
    institutionId: number,
    locationId: number,
    options?: {
      programId?: number;
      restrictionCode?: RestrictionCode;
      actionTypes?: RestrictionActionType[];
      limitOne?: boolean;
    },
  ): Promise<InstitutionRestriction[]> {
    const query = this.institutionRestrictionRepo
      .createQueryBuilder("institutionRestriction")
      .select([
        "institutionRestriction.id",
        "restriction.id",
        "restriction.restrictionCode",
        "restriction.metadata",
      ])
      .innerJoin("institutionRestriction.restriction", "restriction")
      .where("institutionRestriction.isActive = TRUE")
      .andWhere("institutionRestriction.institution.id = :institutionId", {
        institutionId,
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where("institutionRestriction.location.id = :locationId", {
            locationId,
          }).orWhere("institutionRestriction.location.id IS NULL");
        }),
      );
    if (options?.programId) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where("institutionRestriction.program.id = :programId", {
            programId: options.programId,
          }).orWhere("institutionRestriction.program.id IS NULL");
        }),
      );
    } else {
      // If the program is not provided, then only restrictions that are not specific to a program are considered.
      query.andWhere("institutionRestriction.program.id IS NULL");
    }
    if (options?.restrictionCode) {
      query.andWhere("restriction.restrictionCode = :restrictionCode", {
        restrictionCode: options.restrictionCode,
      });
    }
    if (options?.actionTypes?.length) {
      query.andWhere("restriction.actionType && :actionTypes", {
        actionTypes: options.actionTypes,
      });
    }
    if (options?.limitOne) {
      query.limit(1);
    }
    return query.getMany();
  }

  /**
   * Creates a query to be used to determine if there are any effective institution
   * restrictions for the given institution and location (program specific not considered).
   * This allows callers to consume only the SQL fragment when composing subqueries.
   * @param actionTypes restriction action types to filter the restrictions.
   * @returns query and parameters to be used in the parent query builder.
   */
  getEffectiveInstitutionRestrictionsExistsQuery(
    actionTypes: RestrictionActionType[],
  ): QueryAndParamsForExecution {
    const parameters = {} as ObjectLiteral;
    const actionTypesParam = "actionTypesParam";
    const existsQuery = this.institutionRestrictionRepo
      .createQueryBuilder("institutionRestriction")
      .select("1")
      .innerJoin("institutionRestriction.restriction", "restriction")
      .where("institutionRestriction.isActive = TRUE")
      .andWhere("institutionRestriction.institution.id = institution.id")
      .andWhere(
        new Brackets((qb) => {
          qb.where("institutionRestriction.location.id = location.id").orWhere(
            "institutionRestriction.location.id IS NULL",
          );
        }),
      )
      .andWhere("institutionRestriction.program.id IS NULL")
      .andWhere(`restriction.actionType @> :${actionTypesParam}`)
      .limit(1)
      .getQuery();
    parameters[actionTypesParam] = actionTypes;
    return { query: existsQuery, parameters };
  }

  /**
   * Evaluate if the assessment acceptance is blocked by some institution restriction.
   * Institutions may have restrictions that can prevent students from accepting assessments,
   * till the restriction is removed.
   * This method does not consider any student restrictions, only institution restrictions.
   * @param applicationId application ID to evaluate the assessment acceptance.
   * @returns the result of the evaluation, indicating if the assessment can be accepted and any restriction codes that block the acceptance.
   */
  async evaluateAcceptAssessment(
    applicationId: number,
  ): Promise<AcceptAssessmentRestrictionsEvaluationResult> {
    const application = await this.applicationRepo.findOneOrFail({
      select: {
        id: true,
        offeringIntensity: true,
        currentAssessment: {
          id: true,
          offering: {
            id: true,
            institutionLocation: { id: true, institution: { id: true } },
            educationProgram: { id: true },
          },
        },
      },
      relations: {
        currentAssessment: {
          offering: {
            institutionLocation: { institution: true },
            educationProgram: true,
          },
        },
      },
      where: { id: applicationId },
    });
    // Both Stop Accept Assessment and Stop Disbursement restrictions block accept assessment.
    const actionTypes =
      application.offeringIntensity === OfferingIntensity.fullTime
        ? [
            RestrictionActionType.StopFullTimeAcceptAssessment,
            RestrictionActionType.StopFullTimeDisbursement,
          ]
        : [
            RestrictionActionType.StopPartTimeAcceptAssessment,
            RestrictionActionType.StopPartTimeDisbursement,
          ];
    const offering = application.currentAssessment.offering;
    const effectiveInstitutionRestrictions =
      await this.getEffectiveInstitutionRestrictions(
        offering.institutionLocation.institution.id,
        offering.institutionLocation.id,
        { programId: offering.educationProgram.id, actionTypes },
      );
    if (effectiveInstitutionRestrictions.length) {
      return {
        canAcceptAssessment: false,
        restrictions: effectiveInstitutionRestrictions.map((restriction) => ({
          code: restriction.restriction.restrictionCode,
          message:
            restriction.restriction.metadata?.messages?.studentAcceptAssessment,
        })),
      };
    }
    return {
      canAcceptAssessment: true,
      restrictions: [],
    };
  }
}
