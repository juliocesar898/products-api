import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AutocompleteDto {
  @ApiProperty({
    description: 'PPrefix or word to autocomplete',
    example: 'lap',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  q: string;
}