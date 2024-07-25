import { Module } from '@nestjs/common'
import { TestController } from './test.controller'
import { CrudModule } from 'src/crud/crud.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Test } from 'src/entity/test.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Test]), CrudModule],
  controllers: [TestController],
  providers: [],
})
export class TestModule {}
