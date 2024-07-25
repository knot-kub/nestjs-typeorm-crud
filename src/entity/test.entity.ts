import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity('test')
export class Test {
  @PrimaryGeneratedColumn('uuid')
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
  public createdAt: Date
}
