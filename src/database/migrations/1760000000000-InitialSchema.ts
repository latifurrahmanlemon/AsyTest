import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumnOptions,
  TableForeignKey,
  TableUnique,
} from 'typeorm';

export class InitialSchema1760000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const driver = queryRunner.connection.options.type;
    const isMySql = driver === 'mysql' || driver === 'mariadb';

    const idColumn = (): TableColumnOptions => ({
      name: 'id',
      type: isMySql ? 'varchar' : 'uuid',
      length: isMySql ? '36' : undefined,
      isPrimary: true,
      isNullable: false,
    });

    const createdAtColumn = (): TableColumnOptions => ({
      name: 'createdAt',
      type: 'timestamp',
      default: 'CURRENT_TIMESTAMP',
      isNullable: false,
    });

    const updatedAtColumn = (): TableColumnOptions => ({
      name: 'updatedAt',
      type: 'timestamp',
      default: 'CURRENT_TIMESTAMP',
      onUpdate: isMySql ? 'CURRENT_TIMESTAMP' : undefined,
      isNullable: false,
    });

    if (!(await queryRunner.hasTable('tenants'))) {
      await queryRunner.createTable(
        new Table({
          name: 'tenants',
          columns: [
            idColumn(),
            { name: 'name', type: 'varchar', length: '120', isNullable: false },
            {
              name: 'slug',
              type: 'varchar',
              length: '140',
              isNullable: false,
              isUnique: true,
            },
            createdAtColumn(),
            updatedAtColumn(),
          ],
        }),
        true,
      );
    }

    if (!(await queryRunner.hasTable('users'))) {
      await queryRunner.createTable(
        new Table({
          name: 'users',
          columns: [
            idColumn(),
            { name: 'tenantId', type: 'varchar', length: '36', isNullable: false },
            {
              name: 'fullName',
              type: 'varchar',
              length: '120',
              isNullable: false,
            },
            { name: 'email', type: 'varchar', length: '190', isNullable: false },
            {
              name: 'passwordHash',
              type: 'varchar',
              length: '120',
              isNullable: false,
            },
            {
              name: 'role',
              type: 'varchar',
              length: '20',
              default: "'user'",
              isNullable: false,
            },
            {
              name: 'isActive',
              type: isMySql ? 'tinyint' : 'boolean',
              default: isMySql ? '1' : 'true',
              isNullable: false,
            },
            createdAtColumn(),
            updatedAtColumn(),
          ],
          uniques: [
            new TableUnique({ name: 'uq_users_email', columnNames: ['email'] }),
          ],
          foreignKeys: [
            new TableForeignKey({
              columnNames: ['tenantId'],
              referencedTableName: 'tenants',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            }),
          ],
        }),
        true,
      );
    }

    if (!(await queryRunner.hasTable('password_reset_tokens'))) {
      await queryRunner.createTable(
        new Table({
          name: 'password_reset_tokens',
          columns: [
            idColumn(),
            { name: 'userId', type: 'varchar', length: '36', isNullable: false },
            {
              name: 'tokenHash',
              type: 'varchar',
              length: '128',
              isNullable: false,
            },
            { name: 'expiresAt', type: 'timestamp', isNullable: false },
            { name: 'usedAt', type: 'timestamp', isNullable: true },
            createdAtColumn(),
          ],
          foreignKeys: [
            new TableForeignKey({
              columnNames: ['userId'],
              referencedTableName: 'users',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            }),
          ],
        }),
        true,
      );
    }

    if (!(await queryRunner.hasTable('smtp_configs'))) {
      await queryRunner.createTable(
        new Table({
          name: 'smtp_configs',
          columns: [
            idColumn(),
            { name: 'tenantId', type: 'varchar', length: '36', isNullable: false },
            { name: 'host', type: 'varchar', length: '200', isNullable: false },
            { name: 'port', type: 'int', isNullable: false },
            {
              name: 'secure',
              type: isMySql ? 'tinyint' : 'boolean',
              default: isMySql ? '0' : 'false',
              isNullable: false,
            },
            {
              name: 'username',
              type: 'varchar',
              length: '190',
              isNullable: true,
            },
            { name: 'passwordEncrypted', type: 'text', isNullable: true },
            {
              name: 'fromEmail',
              type: 'varchar',
              length: '190',
              isNullable: false,
            },
            {
              name: 'fromName',
              type: 'varchar',
              length: '120',
              isNullable: true,
            },
            createdAtColumn(),
            updatedAtColumn(),
          ],
          uniques: [
            new TableUnique({
              name: 'uq_smtp_configs_tenant_id',
              columnNames: ['tenantId'],
            }),
          ],
          foreignKeys: [
            new TableForeignKey({
              columnNames: ['tenantId'],
              referencedTableName: 'tenants',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            }),
          ],
        }),
        true,
      );
    }

    if (!(await queryRunner.hasTable('email_jobs'))) {
      await queryRunner.createTable(
        new Table({
          name: 'email_jobs',
          columns: [
            idColumn(),
            { name: 'tenantId', type: 'varchar', length: '36', isNullable: false },
            {
              name: 'createdByUserId',
              type: 'varchar',
              length: '36',
              isNullable: false,
            },
            { name: 'toEmail', type: 'varchar', length: '190', isNullable: false },
            { name: 'subject', type: 'varchar', length: '200', isNullable: false },
            { name: 'body', type: 'text', isNullable: false },
            {
              name: 'status',
              type: 'varchar',
              length: '32',
              default: "'queued'",
              isNullable: false,
            },
            { name: 'attemptsMade', type: 'int', default: '0', isNullable: false },
            { name: 'maxAttempts', type: 'int', default: '3', isNullable: false },
            { name: 'nextRunAt', type: 'timestamp', isNullable: true },
            { name: 'lastError', type: 'text', isNullable: true },
            {
              name: 'providerMessageId',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            { name: 'providerResponse', type: 'text', isNullable: true },
            { name: 'acceptedJson', type: 'text', isNullable: true },
            { name: 'rejectedJson', type: 'text', isNullable: true },
            { name: 'smtpSnapshotJson', type: 'text', isNullable: false },
            { name: 'metadataJson', type: 'text', isNullable: true },
            createdAtColumn(),
            updatedAtColumn(),
          ],
          foreignKeys: [
            new TableForeignKey({
              columnNames: ['tenantId'],
              referencedTableName: 'tenants',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            }),
            new TableForeignKey({
              columnNames: ['createdByUserId'],
              referencedTableName: 'users',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            }),
          ],
        }),
        true,
      );
    }

    if (!(await queryRunner.hasTable('email_job_histories'))) {
      await queryRunner.createTable(
        new Table({
          name: 'email_job_histories',
          columns: [
            idColumn(),
            { name: 'tenantId', type: 'varchar', length: '36', isNullable: false },
            { name: 'jobId', type: 'varchar', length: '36', isNullable: false },
            { name: 'status', type: 'varchar', length: '32', isNullable: false },
            { name: 'event', type: 'varchar', length: '120', isNullable: false },
            { name: 'attempt', type: 'int', default: '0', isNullable: false },
            { name: 'message', type: 'text', isNullable: false },
            { name: 'metadataJson', type: 'text', isNullable: true },
            createdAtColumn(),
          ],
          foreignKeys: [
            new TableForeignKey({
              columnNames: ['tenantId'],
              referencedTableName: 'tenants',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            }),
            new TableForeignKey({
              columnNames: ['jobId'],
              referencedTableName: 'email_jobs',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            }),
          ],
        }),
        true,
      );
    }

    if (!(await queryRunner.hasTable('audit_logs'))) {
      await queryRunner.createTable(
        new Table({
          name: 'audit_logs',
          columns: [
            idColumn(),
            { name: 'tenantId', type: 'varchar', length: '36', isNullable: true },
            { name: 'userId', type: 'varchar', length: '36', isNullable: true },
            { name: 'level', type: 'varchar', length: '16', isNullable: false },
            { name: 'event', type: 'varchar', length: '120', isNullable: false },
            {
              name: 'resourceType',
              type: 'varchar',
              length: '80',
              isNullable: true,
            },
            {
              name: 'resourceId',
              type: 'varchar',
              length: '120',
              isNullable: true,
            },
            { name: 'message', type: 'text', isNullable: false },
            { name: 'metadataJson', type: 'text', isNullable: true },
            createdAtColumn(),
          ],
          foreignKeys: [
            new TableForeignKey({
              columnNames: ['tenantId'],
              referencedTableName: 'tenants',
              referencedColumnNames: ['id'],
              onDelete: 'SET NULL',
            }),
            new TableForeignKey({
              columnNames: ['userId'],
              referencedTableName: 'users',
              referencedColumnNames: ['id'],
              onDelete: 'SET NULL',
            }),
          ],
        }),
        true,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_logs', true);
    await queryRunner.dropTable('email_job_histories', true);
    await queryRunner.dropTable('email_jobs', true);
    await queryRunner.dropTable('smtp_configs', true);
    await queryRunner.dropTable('password_reset_tokens', true);
    await queryRunner.dropTable('users', true);
    await queryRunner.dropTable('tenants', true);
  }
}
