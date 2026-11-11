import { Module, type DynamicModule } from '@nestjs/common';
import { AppConfig } from './config.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthController } from './health.controller.js';
import { QuestionnaireModule } from './questionnaires/questionnaire.module.js';

@Module({ controllers: [HealthController] })
export class AppModule {
  static register(config: AppConfig): DynamicModule {
    return { module: AppModule, imports: [DatabaseModule.register(config), QuestionnaireModule] };
  }
}
