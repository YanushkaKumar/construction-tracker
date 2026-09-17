import { IsString, MinLength, MaxLength, IsOptional, IsBoolean, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const PASSWORD_STRENGTH_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export class UpdateUserDto {
  /**
   * Lets a company owner reset a team member's password.
   *
   * Without this there was no way to reset a password anywhere in the product
   * — the "forgot password" screen was a stub and nothing else touched the
   * hash — so a forgotten password permanently orphaned the account.
   */
  @ApiProperty({ example: 'StrongP@ss123', required: false })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Password must be at least 10 characters' })
  @MaxLength(128)
  @Matches(PASSWORD_STRENGTH_REGEX, {
    message:
      'Password must include an uppercase letter, a lowercase letter, a number, and a special character',
  })
  password?: string;

  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({ example: '+94771234567', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'role-cuid-here', required: false })
  @IsOptional()
  @IsString()
  roleId?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
