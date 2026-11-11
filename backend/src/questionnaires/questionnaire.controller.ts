import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ModuleDto, QuestionnaireDto, QuestionDto, SearchDto, SubmitResponseDto } from './questionnaire.dto.js';
import { QuestionnaireService } from './questionnaire.service.js';
import { ResponseService } from './response.service.js';
import { StructureService } from './structure.service.js';

@Controller('questionnaires')
export class QuestionnaireController {
  constructor(private readonly surveys: QuestionnaireService) {}

  @Get()
  search(@Query() query: SearchDto) {
    return this.surveys.search(query);
  }

  @Post()
  create(@Body() dto: QuestionnaireDto) {
    return this.surveys.create(dto);
  }

  @Get(':questionnaireUuid')
  detail(@Param('questionnaireUuid') uuid: string) {
    return this.surveys.detail(uuid);
  }

  @Put(':questionnaireUuid')
  update(@Param('questionnaireUuid') uuid: string, @Body() dto: QuestionnaireDto) {
    return this.surveys.update(uuid, dto);
  }

  @Delete(':questionnaireUuid')
  remove(@Param('questionnaireUuid') uuid: string) {
    return this.surveys.remove(uuid);
  }
}

@Controller('questionnaires/:questionnaireUuid/modules')
export class StructureController {
  constructor(
    private readonly structure: StructureService,
    private readonly responses: ResponseService,
  ) {}

  @Post()
  createModule(@Param('questionnaireUuid') uuid: string, @Body() dto: ModuleDto) {
    return this.structure.createModule(uuid, dto.name);
  }

  @Put(':moduleUuid')
  updateModule(
    @Param('questionnaireUuid') uuid: string,
    @Param('moduleUuid') module: string,
    @Body() dto: ModuleDto,
  ) {
    return this.structure.updateModule(uuid, module, dto.name);
  }

  @Delete(':moduleUuid')
  removeModule(@Param('questionnaireUuid') uuid: string, @Param('moduleUuid') module: string) {
    return this.structure.removeModule(uuid, module);
  }

  @Post(':moduleUuid/questions')
  createQuestion(
    @Param('questionnaireUuid') uuid: string,
    @Param('moduleUuid') module: string,
    @Body() dto: QuestionDto,
  ) {
    return this.structure.createQuestion(uuid, module, dto);
  }

  @Put(':moduleUuid/questions/:questionUuid')
  updateQuestion(
    @Param('questionnaireUuid') uuid: string,
    @Param('moduleUuid') module: string,
    @Param('questionUuid') question: string,
    @Body() dto: QuestionDto,
  ) {
    return this.structure.updateQuestion(uuid, module, question, dto);
  }

  @Delete(':moduleUuid/questions/:questionUuid')
  removeQuestion(
    @Param('questionnaireUuid') uuid: string,
    @Param('moduleUuid') module: string,
    @Param('questionUuid') question: string,
  ) {
    return this.structure.removeQuestion(uuid, module, question);
  }

  @Post(':moduleUuid/questions/:questionUuid/answer')
  answer(
    @Param('questionnaireUuid') uuid: string,
    @Param('moduleUuid') module: string,
    @Param('questionUuid') question: string,
    @Body() dto: SubmitResponseDto,
  ) {
    return this.responses.submit(uuid, module, question, dto);
  }
}
