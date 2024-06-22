import { JsonController, Res, Get, Post, Req, UploadedFile, HttpCode, UseAfter } from 'routing-controllers';
import { Container } from 'typedi';
import * as express from 'express';
import { fileUploadMiddleware } from '../customMiddleware/FileUploadMiddleware';
import { ErrorHandlerMiddleware } from '../customMiddleware/ErrorHandlerMiddleware';
import { PlantsService } from '../services/PlantsService';
import { ClassValidator } from '../decorators/Validator';
import { PlantsQuery } from '../DTOS/PlantsQueryDTO';

@JsonController('/plants')
@UseAfter(ErrorHandlerMiddleware)
export class PlantsController {
  private plantsService: PlantsService;
  constructor(
  ) {
    this.plantsService = Container.get(PlantsService);
  }

  @Post('/upload/file')
  @HttpCode(200)
  async uploadFile(
    @UploadedFile('file', { options: fileUploadMiddleware }) file: any,
    @Res() response: express.Response
  ) {
    await this.plantsService.parseFile(file);
    return response.send();
  }

  @Get('/')
  @HttpCode(200)
  async getPlants(
    @ClassValidator(PlantsQuery, 'query') query: PlantsQuery,
    @Req() req: express.Request
  ) {
    const { filterBy, topPlants, state } = query;
    return await this.plantsService.getPlants(filterBy, topPlants, state);
  }
}
