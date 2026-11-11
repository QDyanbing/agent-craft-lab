import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsString,
  Max,
  MaxLength,
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

export const questionTypes = ['single', 'multiple', 'text', 'number'] as const;
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

  @ValidateIf((q: QuestionDto) => q.type === 'single' || q.type === 'multiple')
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

  @ValidateIf((q: SearchDto) => q.pageSize !== undefined || q.pageNum !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  pageNum?: number;

  @ValidateIf((q: SearchDto) => q.pageNum !== undefined || q.pageSize !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  pageSize?: number;
}

export class SubmitResponseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  requestId!: string;

  @IsString()
  revision!: string;

  @Transform(({ obj }) => obj.answers)
  @IsObject()
  answers!: Record<string, unknown>;
}

export function invalidDto([error]: ValidationError[]) {
  switch (error?.property) {
    case 'pageNum':
    case 'pageSize':
      return new QuestionnaireError('pagination');
    case 'options':
      if (Array.isArray(error.value) && error.value.length)
        return new QuestionnaireError('required');
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
