import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTestTable1721670977838 implements MigrationInterface {
    name = 'CreateTestTable1721670977838'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "test" ("uuid" uuid NOT NULL, "varchar" character varying NOT NULL, "bool" boolean NOT NULL, "int" integer NOT NULL, "json" json NOT NULL, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createDate" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b2022f60bfeca87c976a73df8c6" PRIMARY KEY ("uuid"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "test"`);
    }

}
