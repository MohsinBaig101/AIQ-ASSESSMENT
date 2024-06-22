import * as fs from 'fs';
import * as multer from 'multer';
import { env } from '../../../env';
import * as path from 'path';
import { filePath } from '../../lib/env/helpers';
import { CustomError } from '../errors/CustomError';

export const fileUploadMiddleware = {
    storage: multer.diskStorage({
        destination: (req: any, file: any, cb: any) => {
            const dir = filePath(env.constants.tempFilePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            cb(undefined, dir);
        },
        filename: (req: any, file: any, cb: any) => {
            // can extract the file properties like: filename, extension etc...
            cb(undefined, Date.now() + path.extname(file.originalname));
        },
    }),
    fileFilter: (req: any, file: any, cb: any) => {
        // can add the validation like: fileType, size, etc...
        const allowedMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            return cb(null, true);
        } else {
            cb(new CustomError('FIELD_MIMETYPE_INVALID'));
        }
    },
};
