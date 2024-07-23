import {
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common'
import { Request } from 'express'
import {
  And,
  EntityManager,
  FindOptionsWhere,
  Like,
  Repository,
  SelectQueryBuilder,
} from 'typeorm'
import { assign, pick } from 'lodash'

export interface CrudControllerOptions<T> {
  searchableFields: (keyof T)[]
  distinctableFields: (keyof T)[]
  preSave: ((
    request: Request,
    em: EntityManager,
    entity: T,
    isCreating: boolean,
  ) => Promise<T>)[]
  postSave: ((
    request: Request,
    em: EntityManager,
    entity: T,
    isCreating: boolean,
  ) => Promise<T>)[]
  afterLoad: ((
    request: Request,
    entities: T[],
    isGetOne: boolean,
  ) => Promise<T[]>)[]
  preDelete: ((
    request: Request,
    em: EntityManager,
    entity: T,
  ) => Promise<void>)[]
  postDelete: ((
    request: Request,
    em: EntityManager,
    entity: T,
  ) => Promise<void>)[]
}

@Controller()
export class CrudController<T> {
  constructor(
    private readonly cnstr: new () => T,
    protected readonly resourceKey: keyof T,
    protected readonly options: CrudControllerOptions<T>,
    protected readonly repository: Repository<T>,
  ) {}

  @Post()
  public async createOne(@Req() request: Request): Promise<T> {
    const body = request.body

    if (!body) {
      throw new HttpException('Empty update body', HttpStatus.BAD_REQUEST)
    }

    if (typeof body === 'string' || typeof body === 'number') {
      throw new HttpException('Expected JSON body', HttpStatus.BAD_REQUEST)
    }

    let entity = new this.cnstr()

    return await this.repository.manager.transaction(
      async (em: EntityManager): Promise<T> => {
        entity = em.create(this.cnstr, body)

        for (const executor of this.options.preSave) {
          entity = await executor(request, em, entity, true)
        }

        await em.save(entity)

        for (const executor of this.options.postSave) {
          entity = await executor(request, em, entity, true)
        }

        return entity
      },
    )
  }

  @Get('/:id')
  public async getOne(
    @Req() request: Request,
    @Param('id') id: string,
    manager?: EntityManager,
  ): Promise<T> {
    const em: EntityManager = manager || this.repository.manager

    const where: FindOptionsWhere<T> = {
      [this.resourceKey]: id,
    } as FindOptionsWhere<T>

    let entity: T = null
    entity = await em.findOne(this.cnstr, { where })

    if (!entity) {
      throw new HttpException('Resource not found.', HttpStatus.NOT_FOUND)
    }

    let entities = [entity]
    for (const executor of this.options.afterLoad) {
      entities = await executor(request, entities, true)
    }

    if (entities.length !== 1) {
      throw new HttpException(
        'Internal resource hooks might not returned promised objects. Please check afterLoad hooks.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    return entities[0]
  }

  @Patch('/:id')
  public async updateOne(
    @Req() request: Request,
    @Param('id') id: string,
  ): Promise<T> {
    const body = request.body

    if (!body) {
      throw new HttpException('Empty update body', HttpStatus.BAD_REQUEST)
    }

    if (typeof body === 'string' || typeof body === 'number') {
      throw new HttpException('Expected JSON body', HttpStatus.BAD_REQUEST)
    }

    return await this.repository.manager.transaction(
      async (em: EntityManager): Promise<T> => {
        let entity: T = await this.getOne(request, id, em)
        assign(entity, body)

        for (const executor of this.options.preSave) {
          entity = await executor(request, em, entity, false)
        }

        await em.save(entity)

        for (const executor of this.options.postSave) {
          entity = await executor(request, em, entity, false)
        }

        return entity
      },
    )
  }

  @Delete('/:id')
  public async deleteOne(
    @Req() request: Request,
    @Param('id') id: string,
  ): Promise<T> {
    return await this.repository.manager.transaction(
      async (em: EntityManager): Promise<T> => {
        const entity = await this.getOne(request, id, em)

        for (const executor of this.options.preDelete) {
          await executor(request, em, entity)
        }

        await em.delete(this.cnstr, entity)

        for (const executor of this.options.postDelete) {
          await executor(request, em, entity)
        }

        return entity
      },
    )
  }

  @Get('/_lov/:fieldName')
  public async distinct(
    @Req() request: Request,
    @Param('fieldName') fieldName: string,
  ): Promise<string[]> {
    if (!this.options.distinctableFields.includes(fieldName as any)) {
      throw new HttpException('Resource not found.', HttpStatus.NOT_FOUND)
    }

    const em: EntityManager = this.repository.manager
    const response = await em
      .createQueryBuilder(this.cnstr, 'r')
      .select(fieldName)
      .distinct()
      .execute()

    return response.map((v) => v[fieldName])
  }

  @Get()
  public async index(
    @Req() request: Request,
  ): Promise<{ items: T[]; count: number }> {
    const limit = (request.query['pageSize'] || 20) as number
    const offset = (((request.query.page || 1) as number) - 1) * limit

    const where = {}

    const em: EntityManager = this.repository.manager

    const query = em
      .createQueryBuilder(this.cnstr, 'r')
      .where('1 == 1')
      .limit(limit)
      .offset(offset)

    // Search string in searchable fields
    const search = request.query.search
    if (search) {
      query.andWhere((qb: SelectQueryBuilder<T>) => {
        for (const searchableField of this.options.searchableFields) {
          qb.orWhere(
            `LOWER(${String(searchableField)}) like %LOWER(${search})%`,
            {
              search,
            },
          )
        }
        return qb
      })
    }

    // Filter by searchable fields
    const filter = pick(request.query, this.options.searchableFields) as Record<
      string,
      string
    >
    for (const [key, value] of Object.entries(filter)) {
      query.andWhere({ [key]: value })
    }

    // Order items
    const order = request.query.order
    if (order) {
      const [column, d] = (order as string).split('+')
      const direction: 'ASC' | 'DESC' = (
        ['ASC', 'DESC'].includes(d.toUpperCase()) ? d.toUpperCase() : 'ASC'
      ) as 'ASC' | 'DESC'
      query.orderBy({ [column]: direction })
    }

    let [items, count] = await query.getManyAndCount()

    for (const executor of this.options.afterLoad) {
      items = await executor(request, items, false)
    }

    return { items, count }
  }
}
