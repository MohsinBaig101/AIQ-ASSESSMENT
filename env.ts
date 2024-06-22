import * as dotenv from 'dotenv';
import * as path from 'path';
import { getOsEnv, getOsEnvNumber, getOsPaths } from './src/lib/env';

enum APP_ENV {
    LOCAL = 'local',
    DEV = 'dev',
    SIT = 'sit',
    UAT = 'uat',
    PROD = 'prod',
    DR = 'dr',
}
const getEnvfile = (depEnv) => (process.env.NODE_ENV === 'production' ? '.env.test' : depEnv && APP_ENV[depEnv.toUpperCase()] ? `aiq-v1-${depEnv.toLowerCase()}.env` : '.env');
const envFile = getEnvfile(process.env.APP_ENV);
console.log(envFile);
console.log(path.join(process.cwd(), envFile))
dotenv.config({ path: path.join(process.cwd(), envFile) });
console.log(getOsPaths('CONTROLLERS'));
export const env = {
    APP_PORT: getOsEnv('APP_PORT'),
    log: {
        debugMode: '' || true,
    },
    app: {
        dirs: {
            uploads: getOsEnv('FILE_UPLOAD_PATH'),
            controllers: getOsPaths('CONTROLLERS'),
            entities: getOsPaths('TYPEORM_ENTITIES'),
        },
    },
    constants: {
        maxSizeUpload: getOsEnvNumber('MAX_SIZE_UPLOAD'),
        fileUploadPath: getOsEnv('FILE_UPLOAD_PATH'),
        tempFilePath: getOsEnv('TEMP_FILE_STORE_PATH'),
        imgOriginalWidth: getOsEnvNumber('IMAGE_ORIGINAL_WIDTH') || 200,
        imgResizeWidth: getOsEnvNumber('IMAGE_RESIZE_WIDTH') || 150,
        plantSheetName: getOsEnv('PLANT_EXCEL_SHEET_NAME'),
        plantLatitudeColumnIndex: getOsEnvNumber('PLANT_LATITUDE_COLUMN_INDEX'),
        plantLongitudeColumnIndex: getOsEnvNumber('PLANT_LONGITUDE_COLUMN_INDEX'),
        plantNameColumnIndex: getOsEnvNumber('PLANT_NAME_COLUMN_INDEX'),
        plantStateColumnIndex: getOsEnvNumber('PLANT_STATE_COLUMN_INDEX'),
        plantNetGenColumnIndex: getOsEnvNumber('PLANT_ANNUAL_NET_GEN'),
        // typeormEntities: process.env.APP_ENV === 'production'
        // ? path.join(__dirname, 'dist/entities/*.js')
        // : path.join(__dirname, 'src/entities/*.ts')
        typeormEntities: getOsEnv('TYPEORM_ENTITIES')
    },
};
