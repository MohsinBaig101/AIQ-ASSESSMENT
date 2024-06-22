import {
  JsonController,
  Post,
  Res,
  UploadedFile,
  HttpCode,
  UseAfter,
} from 'routing-controllers';
import { Container } from 'typedi';
import * as express from 'express';
import { fileUploadMiddleware } from '../customMiddleware/FileUploadMiddleware';
import { ErrorHandlerMiddleware } from '../customMiddleware/ErrorHandlerMiddleware';
import { ImagesService } from '../services/ImagesService';

@JsonController('/upload')
@UseAfter(ErrorHandlerMiddleware)
export class FileUploadController {
  private imageService: ImagesService;
  constructor() {
    this.imageService = Container.get(ImagesService);
  }

  @Post('/file')
  @HttpCode(200)
  async uploadFile(
    @UploadedFile('file', { options: fileUploadMiddleware }) file: any,
    @Res() response: express.Response
  ) {
    await this.imageService.parseImageCSVAndProcess(file);
    return response.send();
  }

}
