import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSignupOtpVerification1760000000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('users', 'emailVerifiedAt'))) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'emailVerifiedAt',
          type: 'timestamp',
          isNullable: true,
        }),
      );
    }

    if (!(await queryRunner.hasColumn('users', 'emailVerificationCodeHash'))) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'emailVerificationCodeHash',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }

    if (!(await queryRunner.hasColumn('users', 'emailVerificationExpiresAt'))) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'emailVerificationExpiresAt',
          type: 'timestamp',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('users', 'emailVerificationExpiresAt')) {
      await queryRunner.dropColumn('users', 'emailVerificationExpiresAt');
    }

    if (await queryRunner.hasColumn('users', 'emailVerificationCodeHash')) {
      await queryRunner.dropColumn('users', 'emailVerificationCodeHash');
    }

    if (await queryRunner.hasColumn('users', 'emailVerifiedAt')) {
      await queryRunner.dropColumn('users', 'emailVerifiedAt');
    }
  }
}
