import "reflect-metadata";
import { createExpressServer } from "routing-controllers";
import * as path from "path";
import express from "express";
import { typeOrmLoader } from "./src/loaders";
import { env } from "./env";
import {
  PlantsController,
  ImagesController,
  FileUploadController,
  HealthController,
} from "./src/api/controllers";

async function startApplication() {

  /**
   * creates express app, registers all controller routes and returns express app instance
   */
  const app = createExpressServer({
    routePrefix: "/v1",
    controllers: [
      HealthController,
      PlantsController,
      ImagesController,
      FileUploadController,
    ],
    middlewares: [],
    defaultErrorHandler: false,
  });

  app.use(express.static(path.join(__dirname, "public")));

  //establish DB connection
  await typeOrmLoader();

  // run express application on port 3000
  app.listen(env.APP_PORT || 3000);
  console.log("Express server listening on port", process.env.APP_PORT);
}

startApplication();
