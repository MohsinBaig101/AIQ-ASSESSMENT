import fs from 'fs';
import * as path from 'path';
import { Service } from 'typedi';
import _ from 'lodash';
import csv from 'csv-parse';
import sharp from 'sharp';
import bunyan from 'bunyan';
import { AppDataSource } from '../../loaders/db/typeorm';
import { DataSource } from 'typeorm';
import { Image } from '../entities/Image.entity';
import {
    ensureDirectoryExistence,
    writeFileAsync,
    filePath,
    removeTempFile,
} from '../../lib/env/helpers';
import { env } from '../../../env';
import { Logger } from '../../lib/logger';

@Service()
export class ImagesService {
    private dbInstance: DataSource;
    private log: bunyan;
    constructor() {
        this.dbInstance = AppDataSource;
        this.log = new Logger(__filename).child({ serviceId: 'IMAGE_SERVICE' });
    }
    public async getImages(depthMin: number, depthMax: number): Promise<Image[]> {
        return await this.dbInstance
            .getRepository(Image)
            .createQueryBuilder('image')
            .where('image.depth >= :depthMin', { depthMin })
            .andWhere('image.depth <= :depthMax', { depthMax })
            .getMany();
    }
    public async parseImageCSVAndProcess(file: { path: string }): Promise<void> {
        const logger = this.log.child({
            type: 'PARSE_IMAGE_CSV',
        });
        return await new Promise((resolve, reject) => {
            const images: { depth: number, pixels: any[] }[] = [];
            fs.createReadStream(file.path)
                .pipe(csv.parse({ columns: true }))
                .on('data', async (row) => {
                    logger.info('FILE_DATA_RECEIVED');
                    const depth = parseFloat(_.get(row, 'depth'));
                    const pixels = Object.keys(row)
                        .filter((key) => key !== 'depth')
                        .map((key) => parseInt(row[key]));
                    logger.info('CREATED_THE_PIXEL_AND_DEPTH_ARRAY');
                    images.push({ depth, pixels });
                })
                .on('end', async () => {
                    logger.info('VALIDATE_DIRECTORY_EXIST');
                    ensureDirectoryExistence(
                        path.join(process.cwd(), env.constants.fileUploadPath)
                    );
                    await this.storeImages(images, logger);
                    removeTempFile(file.path, logger);
                    resolve();
                })
                .on('error', async () => {
                    removeTempFile(file.path, logger);
                    reject(new Error());
                });
        });
    }
    private async storeImages(
        images: { depth: number; pixels: number[] }[],
        logger: bunyan
    ): Promise<void> {
        const resizedImages = await Promise.all(
            images.map((image) => {
                return this.resizeImage(image.pixels, image.depth, logger);
            })
        );
        logger.info('IMAGE_RESIZED_SUCCESSFULLY');
        this.saveImages(resizedImages, logger);
        logger.info('IMAGES_RESIZED_SAVED_IN_DB');
        return;
    }

    private async resizeImage(
        pixels: number[],
        depth: number,
        logger: bunyan
    ): Promise<{ depth: number; imageData: Buffer; fileName: string }> {
        const originalWidth = env.constants.imgOriginalWidth;
        const newWidth = env.constants.imgResizeWidth;
        const height = pixels.length / originalWidth;
        logger.info({ originalWidth, newWidth, height }, 'RESIZE_IMG_CONFIG');
        const buffer = Buffer.from(pixels);
        const resizedBuffer = await sharp(buffer, {
            raw: {
                width: originalWidth,
                height,
                channels: 1,
            },
        }).resize(newWidth).toFormat('png').toBuffer();
        logger.info('IMG_RESIZED_SUCCESSFULLY');
        const fileName = `${Date.now()}-${depth}.png`;
        this.storeFilesAsync(resizedBuffer, fileName, logger);
        return {
            depth,
            imageData: resizedBuffer,
            fileName,
        };
    }
    // storing file asynchronously, we can handle the errors but that depends on the use case.
    private storeFilesAsync(buffer: Buffer, fileName: string, logger: bunyan) {
        writeFileAsync(
            buffer,
            filePath(`${env.constants.fileUploadPath}/${fileName}`)
        )
            .then(() => {
                // console.log("Success");
            })
            .catch((err) => {
                logger.error({ err }, 'FAILED_TO_SAVE_FILE');
            });
    }

    private async saveImages(resizedImages: {
        depth: number;
        imageData: Buffer;
        fileName: string;
    }[], logger: bunyan) {
        try {
            await this.dbInstance.getRepository(Image).save(resizedImages);
        } catch (err) {
            logger.error({ err }, 'FAILED_STORE_DOCUMENTS');
        }
    }
}
