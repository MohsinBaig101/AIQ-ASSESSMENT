import 'reflect-metadata';
// import { config } from 'dotenv';
// config();
import { env } from './env';
import { createExpressServer } from 'routing-controllers';
import * as path from 'path';
import { typeOrmLoader } from './src/loaders';
import { PlantsController } from './src/api/controllers/PlantsController';
import { ImagesController } from './src/api/controllers/ImagesController';
import { FileUploadController } from './src/api/controllers/FileUploadController';
import { HealthController } from './src/api/controllers/HealthController';
import express from 'express';

async function startApplication() {
  // creates express app, registers all controller routes and returns you express app instance
  const app = createExpressServer({
    routePrefix: '/v1',
    // cors: true,
    // controllers: [path.join(__dirname, '/src/api/controllers/**/*.ts')], // we specify controllers we want to use
    controllers: [HealthController, PlantsController, ImagesController, FileUploadController], // we specify controllers we want to use
    middlewares: [],
    defaultErrorHandler: false
  });
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/static', express.static('public'));
  await typeOrmLoader();
  // run express application on port 3000
  app.listen(env.APP_PORT || 3000);
  console.log("Express server listening on port", process.env.APP_PORT);
}
startApplication();