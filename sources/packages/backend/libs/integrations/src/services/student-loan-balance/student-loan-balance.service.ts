import { Injectable } from "@nestjs/common";
import { SystemUsersService } from "@sims/services";
import { StudentLoanBalance } from "@sims/sims-db";
import { EntityManager } from "typeorm";

@Injectable()
export class StudentLoanBalanceService {
  constructor(private readonly systemUserService: SystemUsersService) {}
  /**
   * Most recent balance present on database.
   * If no records are present, returns undefined.
   * @param entityManager used to get the data in and share the database transaction.
   * @returns the most updated balance date, if present, otherwise, undefined.
   */
  async getLastBalanceDate(
    entityManager: EntityManager,
  ): Promise<Date | undefined> {
    const maxBalanceDateAlias = "maxBalanceDate";
    const lastBalanceDate = await entityManager
      .getRepository(StudentLoanBalance)
      .createQueryBuilder("studentLoanBalance")
      .select("MAX(studentLoanBalance.balanceDate)", maxBalanceDateAlias)
      .getRawOne();
    return lastBalanceDate[maxBalanceDateAlias] ?? undefined;
  }

  /**
   * After new student balance records are added to the database, checks if some students
   * are no longer present in the statement which would indicate they no longer have
   * a balance and a zero balance record will be inserted.
   * @param entityManager used to get the data in and share the database transaction.
   * @param previousBalanceDate most recent inserted balance date before the {@link currentBalanceDate}.
   * @param currentBalanceDate date of the balance inserted into database that need
   * to be checked if zero balance records are needed.
   */
  async insertZeroBalanceRecords(
    entityManager: EntityManager,
    previousBalanceDate: Date,
    currentBalanceDate: Date,
  ): Promise<void> {
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
    await studentLoanBalanceRepo.query(
      `INSERT INTO sims.student_loan_balances (student_id, csl_balance, balance_date, creator) (${selectQuery})`,
      selectParameters,
    );
  }
}
