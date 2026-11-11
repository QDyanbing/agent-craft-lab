import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import {
  ModuleDto,
  QuestionnaireDto,
  QuestionDto,
  SearchDto,
  SubmitResponseDto,
} from './questionnaire.dto.js';
import { QuestionnaireService } from './questionnaire.service.js';
import { StructureService } from './structure.service.js';
import { ResponseService } from './response.service.js';

@Controller('questionnaires')
export class QuestionnaireController {
  constructor(
    private readonly surveys: QuestionnaireService,
    private readonly responses: ResponseService,
  ) {}

  @Get()
  search(@Query() query: SearchDto) {
    return this.surveys.search(query);
  }

  @Post()
  create(@Body() dto: QuestionnaireDto) {
    return this.surveys.create(dto);
  }

  @Get(':survey')
  detail(@Param('survey') survey: string) {
    return this.surveys.detail(survey);
  }

  @Put(':survey')
  update(@Param('survey') survey: string, @Body() dto: QuestionnaireDto) {
    return this.surveys.update(survey, dto);
  }

  @Delete(':survey')
  remove(@Param('survey') survey: string) {
    return this.surveys.remove(survey);
  }

  @Post(':survey/responses')
  submit(@Param('survey') survey: string, @Body() dto: SubmitResponseDto) {
    return this.responses.submit(survey, dto);
  }
}

@Controller('questionnaires/:survey/modules')
export class StructureController {
  constructor(private readonly structure: StructureService) {}

  @Post()
  createModule(@Param('survey') survey: string, @Body() dto: ModuleDto) {
    return this.structure.createModule(survey, dto.name);
  }

  @Put(':module')
  updateModule(
    @Param('survey') survey: string,
    @Param('module') module: string,
    @Body() dto: ModuleDto,
  ) {
    return this.structure.updateModule(survey, module, dto.name);
  }

  @Delete(':module')
  removeModule(@Param('survey') survey: string, @Param('module') module: string) {
    return this.structure.removeModule(survey, module);
  }

  @Post(':module/questions')
  createQuestion(
    @Param('survey') survey: string,
    @Param('module') module: string,
    @Body() dto: QuestionDto,
  ) {
    return this.structure.createQuestion(survey, module, dto);
  }

  @Put(':module/questions/:question')
  updateQuestion(
    @Param('survey') survey: string,
    @Param('module') module: string,
    @Param('question') question: string,
    @Body() dto: QuestionDto,
  ) {
    return this.structure.updateQuestion(survey, module, question, dto);
  }

  @Delete(':module/questions/:question')
  removeQuestion(
    @Param('survey') survey: string,
    @Param('module') module: string,
    @Param('question') question: string,
  ) {
    return this.structure.removeQuestion(survey, module, question);
  }
}
