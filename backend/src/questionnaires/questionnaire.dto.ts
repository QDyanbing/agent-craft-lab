import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDefined,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  ValidateIf,
  type ValidationError,
} from 'class-validator';
import { QuestionnaireError } from './questionnaire.error.js';

const trim = (value: unknown) => (typeof value === 'string' ? value.trim() : value);
const Trim = () => Transform(({ value }) => trim(value));

export class ModuleDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class QuestionnaireDto extends ModuleDto {
  @Trim()
  @IsString()
  description = '';
}

export const questionTypes = ['SINGLE', 'MULTIPLE', 'TEXT', 'NUMBER'] as const;
export type QuestionType = (typeof questionTypes)[number];

export class QuestionDto {
  @IsIn(questionTypes)
  type!: QuestionType;

  @Trim()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @Trim()
  @IsString()
  description = '';

  @ValidateIf((q: QuestionDto) => q.type === 'SINGLE' || q.type === 'MULTIPLE')
  @Transform(({ value }) => (Array.isArray(value) ? value.map(trim) : value))
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  options?: string[];
}

export class SearchDto {
  @Trim()
  @IsString()
  keyword = '';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  pageNum!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  pageSize = 10;
}

export class SubmitResponseDto {
  @Transform(({ obj }) => obj.answer)
  @ValidateIf((_, value) => value !== null)
  @IsDefined()
  answer!: unknown;
}

export function invalidDto([error]: ValidationError[]) {
  switch (error?.property) {
    case 'pageNum':
    case 'pageSize':
      return new QuestionnaireError('pagination');
    case 'options':
      return new QuestionnaireError('options');
    case 'type':
      return new QuestionnaireError('type');
    case 'name':
    case 'description':
    case 'title':
    case 'keyword':
      return new QuestionnaireError('required');
    default:
      return new QuestionnaireError('form');
  }
}
