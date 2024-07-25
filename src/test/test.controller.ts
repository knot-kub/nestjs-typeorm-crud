import { Controller } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { CrudController } from 'src/crud/crud.controller'
import { Test } from 'src/entity/test.entity'
import { Repository } from 'typeorm'

@Controller('test')
export class TestController extends CrudController<Test> {
  constructor(
    @InjectRepository(Test) public readonly repository: Repository<Test>,
  ) {
    super(Test, 'uuid', repository, {
      distinctableFields: ['int', 'varchar'],
      searchableFields: ['varchar'],
    })
  }
}
