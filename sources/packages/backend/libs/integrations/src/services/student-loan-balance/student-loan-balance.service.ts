import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SystemUsersService } from "@sims/services";
import { StudentLoanBalance } from "@sims/sims-db";
import { EntityManager } from "typeorm";

@Injectable()
export class StudentLoanBalanceService {
  constructor(
    @InjectRepository(StudentLoanBalance)
    private readonly systemUserService: SystemUsersService,
  ) {}

  /**
   * After new student balance records are added to the database, checks if some students
   * are no longer present in the statement which would indicate they no longer have
   * a balance and a zero balance record will be inserted.
   * @param currentBalanceDate date of the balance inserted into database that need
   * to be checked if zero balance records are needed.
   * @param entityManager used to get the data in and share the database transaction.
   */
  async insertZeroBalanceRecords(
    currentBalanceDate: Date,
    entityManager: EntityManager,
  ): Promise<Pick<StudentLoanBalance, "id">[]> {
    // Previous balance date immediately before the one being imported, if one exists.
    const previousBalanceDate = await this.getLastBalanceDate(
      currentBalanceDate,
      entityManager,
    );
    if (!previousBalanceDate) {
      // If no previous balance date is present, no records exists in the
      // database and there is no need to insert zero balance records.
      return [];
    }
    const mainQueryAlias = "studentLoanBalance";
    const studentLoanBalanceRepo =
      entityManager.getRepository(StudentLoanBalance);
    // Query to check if a student is present in the current balance received.
    const existsQuery = studentLoanBalanceRepo
      .createQueryBuilder("studentLoanBalanceExists")
      .select("1")
      .where(`student_id = "${mainQueryAlias}".student_id`)
      .andWhere("balance_date = :currentBalanceDate")
      .getQuery();
    // Select all the student balances with a balance greater than zero in the
    // previous balance that are no longer present in the current updated balance.
    const [selectQuery, selectParameters] = studentLoanBalanceRepo
      .createQueryBuilder(mainQueryAlias)
      .select(`${mainQueryAlias}.student.id`, "studentId")
      .addSelect("0", "cslBalance")
      .addSelect(":currentBalanceDate", "balanceDate")
      .addSelect(":userServiceId", "creator")
      .where(`${mainQueryAlias}.cslBalance > 0`)
      .andWhere(`${mainQueryAlias}.balanceDate = :previousBalanceDate`)
      .andWhere(`NOT EXISTS (${existsQuery})`)
      .setParameters({
        currentBalanceDate,
        previousBalanceDate,
        userServiceId: this.systemUserService.systemUser.id,
      })
      .getQueryAndParameters();
    return studentLoanBalanceRepo.query(
      `INSERT INTO sims.student_loan_balances (student_id, csl_balance, balance_date, creator) (${selectQuery}) RETURNING id`,
      selectParameters,
    );
  }

  /**
   * Most recent balance date present on database.
   * If no records are present, returns undefined.
   * @param referenceBalanceDate used as a reference to get the last balance before this date.
   * @param entityManager used to get the data in and share the database transaction.
   * @returns the most updated balance date, if present, otherwise, undefined.
   */
  private async getLastBalanceDate(
    referenceBalanceDate: Date,
    entityManager: EntityManager,
  ): Promise<Date | undefined> {
    const maxBalanceDateAlias = "maxBalanceDate";
    const lastBalanceDate = await entityManager
      .getRepository(StudentLoanBalance)
      .createQueryBuilder("studentLoanBalance")
      .select("MAX(studentLoanBalance.balanceDate)", maxBalanceDateAlias)
      .where("studentLoanBalance.balanceDate < :referenceBalanceDate", {
        referenceBalanceDate,
      })
      .getRawOne<{ [maxBalanceDateAlias]: Date }>();
    return lastBalanceDate[maxBalanceDateAlias] ?? undefined;
  }
}
