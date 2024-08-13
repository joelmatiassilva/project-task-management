import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from '../../../application/services/auth.service';
import { RegisterDto, LoginDto } from '../../../application/dtos/auth.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in a user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in.' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}