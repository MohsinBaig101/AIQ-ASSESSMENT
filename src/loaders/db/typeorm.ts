import { DataSource } from 'typeorm';
// import { env } from '../../../env';
import { Image } from '../../api/entities/Image.entity'
import { Plant } from '../../api/entities/Plant.entity'

export const AppDataSource = new DataSource({
    type: process.env.DB_TYPE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
    synchronize: true,
    logging: false,
    entities: [Image, Plant],
    // 'entities': ['dist/entities/*.js'],
    // 'entities': [env.constants.typeormEntities],
} as any);

export async function typeOrmLoader() {
    try {
        await AppDataSource.initialize();
        // in real time project, we used logger
        console.log('DB initialized');
    } catch (err) {
        console.log(err);
    }
}
