import { Global, Module, type DynamicModule } from '@nestjs/common';
import { AppConfig } from '../config.js';
import { DatabaseService } from './database.service.js';

@Global()
@Module({})
export class DatabaseModule {
  static register(config: AppConfig): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [{ provide: AppConfig, useValue: config }, DatabaseService],
      exports: [DatabaseService],
    };
  }
}
