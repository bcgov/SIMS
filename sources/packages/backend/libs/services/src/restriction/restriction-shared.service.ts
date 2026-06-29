import { Injectable } from "@nestjs/common";
import {
  Application,
  InstitutionRestriction,
  OfferingIntensity,
  RecordDataModelService,
  Restriction,
  RestrictionActionType,
} from "@sims/sims-db";
import {
  Brackets,
  DataSource,
  EntityManager,
  Repository,
  SelectQueryBuilder,
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
   * @returns effective institution restrictions.
   */
  getEffectiveInstitutionRestrictions(
    institutionId: number,
    locationId: number,
    options?: {
      programId?: number;
      restrictionCode?: RestrictionCode;
      actionTypes?: RestrictionActionType[];
    },
  ): Promise<InstitutionRestriction[]> {
    const query = this.institutionRestrictionRepo
      .createQueryBuilder("institutionRestriction")
      .select([
        "institutionRestriction.id",
        "restriction.id",
        "restriction.restrictionCode",
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
    }
    if (options?.restrictionCode) {
      query.andWhere("restriction.restrictionCode = :restrictionCode", {
        restrictionCode: options.restrictionCode,
      });
    }
    if (options?.actionTypes?.length) {
      query.andWhere("restriction.actionType @> :actionTypes", {
        actionTypes: options.actionTypes,
      });
    }
    return query.getMany();
  }

  /**
   * Creates a query to be used to determine if there are any effective institution
   * restrictions for the given institution and location.
   * The method also injects the required subquery parameters into the parent query builder.
   * This allows callers to consume only the SQL fragment when composing subqueries.
   * @param parentQueryBuilder parent query builder that will execute the subquery.
   * @param actionTypes restriction action types to filter the restrictions.
   * @returns the EXISTS subquery SQL.
   */
  getEffectiveInstitutionRestrictionsExistsQuery(
    parentQueryBuilder: SelectQueryBuilder<unknown>,
    actionTypes: RestrictionActionType[],
  ): string {
    const actionTypesParam =
      "effectiveInstitutionRestrictionsExistsActionTypes";
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
      .andWhere(`restriction.actionType @> :${actionTypesParam}`)
      .limit(1)
      .getQuery();
    parentQueryBuilder.setParameter(actionTypesParam, actionTypes);
    return existsQuery;
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
    const action =
      application.offeringIntensity === OfferingIntensity.fullTime
        ? RestrictionActionType.StopFullTimeAcceptAssessment
        : RestrictionActionType.StopPartTimeAcceptAssessment;
    const offering = application.currentAssessment.offering;
    const effectiveInstitutionRestrictions =
      await this.getEffectiveInstitutionRestrictions(
        offering.institutionLocation.institution.id,
        offering.institutionLocation.id,
        { programId: offering.educationProgram.id, actionTypes: [action] },
      );
    if (effectiveInstitutionRestrictions.length) {
      return {
        canAcceptAssessment: false,
        restrictionCodes: effectiveInstitutionRestrictions.map(
          (restriction) => restriction.restriction.restrictionCode,
        ),
      };
    }
    return {
      canAcceptAssessment: true,
      restrictionCodes: [],
    };
  }
}
