import {
    Param,
    Get,
    HttpCode,
    UseAfter,
    QueryParams,
    Res,
    Controller
} from 'routing-controllers';
import * as path from 'path';
import express from 'express';
import { Container } from 'typedi';
import { ErrorHandlerMiddleware } from '../customMiddleware/ErrorHandlerMiddleware';
import { ImagesService } from '../services/ImagesService';

@Controller('/images')
@UseAfter(ErrorHandlerMiddleware)
export class ImagesController {
    private imageService: ImagesService;
    constructor() {
        this.imageService = Container.get(ImagesService);
    }

    @Get('/')
    @HttpCode(200)
    async getImages(
        @QueryParams() query: any
    ): Promise<any[]> {
        return this.imageService.getImages(query.depthMin, query.depthMax);
    }

    @Get('/:fileName')
    @HttpCode(200)
    async getImageByFileName(
        @Param('fileName') fileName: any,
        @Res() res: express.Response
    ): Promise<any> {
        const options = {
            root: path.join(__dirname, '../../../public/challenge2/'),
            //   dotfiles: 'deny',
            headers: {
                'x-timestamp': Date.now(),
                'x-sent': true,
            },
        };
        res.sendFile(fileName, options, (err) => {
            if (err) {
                //   next(err)
            } else {
                console.log('Sent:', fileName);
            }
        });
    }

}
