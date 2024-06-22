import { JsonController, Get, HttpCode, UseAfter } from 'routing-controllers';
import { ErrorHandlerMiddleware } from '../customMiddleware/ErrorHandlerMiddleware';

@JsonController('/health')
@UseAfter(ErrorHandlerMiddleware)
export class HealthController {
  constructor(
  ) {
  }

  @Get('/')
  @HttpCode(200)
  public health() {
    return 'container running';
  }
}
