import { DataSource } from 'typeorm'

export const database: DataSource = new DataSource({
  type: 'postgres',
  host: 'postgres',
  port: 5432,
  username: 'root',
  password: 'root',
  database: 'test',
  synchronize: false,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*'],
  logging: true,
})
