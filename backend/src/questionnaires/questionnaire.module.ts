import { Module } from '@nestjs/common';
import { QuestionnaireController, StructureController } from './questionnaire.controller.js';
import { QuestionnaireRepository } from './questionnaire.repository.js';
import { QuestionnaireService } from './questionnaire.service.js';
import { ResponseService } from './response.service.js';
import { StructureService } from './structure.service.js';

@Module({
  controllers: [QuestionnaireController, StructureController],
  providers: [QuestionnaireRepository, QuestionnaireService, ResponseService, StructureService],
})
export class QuestionnaireModule {}
