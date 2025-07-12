import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateApplicationTable1703875200000 implements MigrationInterface {
  name = 'CreateApplicationTable1703875200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the applications table
    await queryRunner.createTable(
      new Table({
        name: 'applications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'company',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'role',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'jobDescription',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'resume',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'coverLetter',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'deadline',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: [
              'pending',
              'interview',
              'offer',
              'rejected',
              'withdrawn',
              'archived',
            ],
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'workflowId',
            type: 'varchar',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes for better performance
    await queryRunner.createIndex(
      'applications',
      new TableIndex({
        name: 'IDX_applications_company',
        columnNames: ['company'],
      }),
    );

    await queryRunner.createIndex(
      'applications',
      new TableIndex({
        name: 'IDX_applications_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'applications',
      new TableIndex({
        name: 'IDX_applications_deadline',
        columnNames: ['deadline'],
      }),
    );

    await queryRunner.createIndex(
      'applications',
      new TableIndex({
        name: 'IDX_applications_created_at',
        columnNames: ['createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('applications', 'IDX_applications_created_at');
    await queryRunner.dropIndex('applications', 'IDX_applications_deadline');
    await queryRunner.dropIndex('applications', 'IDX_applications_status');
    await queryRunner.dropIndex('applications', 'IDX_applications_company');

    // Drop the table
    await queryRunner.dropTable('applications');
  }
}
