import { Controller, Get } from '@nestjs/common'

@Controller('test')
export class TestController {
  @Get('/')
  public test(): string {
    return 'Hello World!'
  }
}
