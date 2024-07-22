import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity('test')
export class Test {
  @PrimaryColumn('uuid')
  public uuid: string

  @Column('varchar')
  public varchar: string

  @Column('boolean')
  public bool: boolean

  @Column('int')
  public int: number

  @Column('json')
  public json: Object

  @UpdateDateColumn()
  public updatedAt: Date

  @CreateDateColumn()
  public createDate: Date
}
