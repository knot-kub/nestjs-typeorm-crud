import { Module } from '@nestjs/common'
import { CrudController } from './crud.controller'

@Module({
  providers: [CrudController],
  exports: [CrudController],
})
export class CrudModule {}
