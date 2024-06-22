import { Service } from 'typedi';
import _ from 'lodash';
import bunyan from 'bunyan';
import { AppDataSource } from '../../loaders/db/typeorm';
import * as Excel from 'exceljs';
import { DataSource } from 'typeorm';
import { Plant } from '../entities/Plant.entity';
import {
  removeTempFile,
} from '../../lib/env/helpers';
import { env } from '../../../env';
import { Logger } from '../../lib/logger';
import { getPlantsMapper } from '../../lib/dataMapper/internal';

@Service()
export class PlantsService {
  private dbInstance: DataSource;
  private log: bunyan;
  constructor() {
    this.log = new Logger(__filename).child({ serviceId: 'IMAGE_SERVICE' });
    this.dbInstance = AppDataSource;
  }

  public async parseFile(file: any): Promise<any> {
    const logger = this.log.child({
      type: 'PARSE_EXCEL',
    });
    const workbook = new Excel.Workbook();
    await workbook.xlsx.readFile(file?.path);
    const worksheet: any = workbook.getWorksheet(env.constants.plantSheetName);
    const plants: any = [];
    worksheet.eachRow((row: any, rowNumber: any) => {
      // Skip headers rows
      if (rowNumber > 2) {
        const plantName = _.get(row.getCell(env.constants.plantNameColumnIndex), 'value');
        const state = _.get(row.getCell(env.constants.plantStateColumnIndex), 'value');
        const latitude = _.get(row.getCell(env.constants.plantLatitudeColumnIndex), 'value');
        const longitude = _.get(row.getCell(env.constants.plantLongitudeColumnIndex), 'value');
        const annualNetGen = Math.abs(_.get(row.getCell(env.constants.plantNetGenColumnIndex), 'value', 0));
        plants.push({
          plantName,
          state,
          annualNetGeneration: annualNetGen || 0,
          latitude,
          longitude,
        });
      }
    });
    await this.dbInstance.manager.save(Plant, plants);
    removeTempFile(file.path, logger);
    return;
  }

  public async getPlants(
    filterBy: string,
    topPlants?: number,
    state?: string
  ): Promise<any> {
    switch (filterBy) {
      case 'plants':
        return this.getPlantsList(topPlants);
        break;
      case 'stateTotals':
        return await this.calculateStateTotals();
        break;
      case 'state':
        return await this.filterPlantsByState(state);
        break;
      case 'plantPercentage':
        return await this.calculatePlantPercentages();
        break;
      default:
        return this.getPlantsList(20);
        break;
    }
  }

  private async calculateStateTotals(): Promise<{ [state: string]: number }> {
    const stateTotals = await this.dbInstance.manager
      .getRepository(Plant)
      .createQueryBuilder('plants')
      .select(
        'plants.state, SUM(plants.annualNetGeneration) AS totalnetgeneration'
      )
      .groupBy('plants.state')
      .getRawMany();

    const stateTotalsMap: { [state: string]: number } = {};
    stateTotals.forEach((result) => {
      stateTotalsMap[result.state] = parseFloat(
        parseFloat(result.totalnetgeneration).toFixed(2)
      );
    });

    return stateTotalsMap;
  }

  private async calculatePlantPercentages(): Promise<
    { plantName: string; percentage: number }[]
  > {
    const plantPercentages = await this.dbInstance.manager.getRepository(Plant)
      .query(`
          SELECT
            p.id,
            p.plant_name AS "plantName",
            p.state,
            p.latitude,
            p.longitude,
            p.net_generation AS "annualNetGeneration",
            st.total_net_generation AS "stateTotalAnnualNetGeneration",
            ROUND((p.net_generation::numeric / st.total_net_generation) * 100, 2) AS "percentage"
          FROM
            plants p
          JOIN (
            SELECT
              state,
              SUM(net_generation) AS total_net_generation
            FROM
              plants
            GROUP BY
              state
          ) st ON p.state = st.state
          ORDER BY
            p.net_generation DESC;
    `);
    return plantPercentages;
  }
  private async getPlantsList(nthPlants: number = 20): Promise<Plant[]> {
    const queryResult = await this.dbInstance.manager
      .getRepository(Plant)
      .createQueryBuilder('plants')
      .orderBy('plants.annualNetGeneration', 'DESC')
      .limit(nthPlants)
      .getMany();
    return getPlantsMapper(queryResult);
  }

  private async filterPlantsByState(state: string = 'AK'): Promise<Plant[]> {
    const queryResult = await this.dbInstance.manager.getRepository(Plant).find({
      where: {
        state,
      },
    });
    return getPlantsMapper(queryResult);
  }
}
