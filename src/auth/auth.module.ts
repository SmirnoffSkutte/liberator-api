import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt/dist';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config/dist';
import { JwtStrategy } from './strategies/jwt_strategy';
import { GoogleStrategy } from './strategies/google_strategy';
import { SessionSerializer } from './Serializer';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),
    TypeOrmModule.forFeature([User])
  ],
  providers: [AuthService,JwtStrategy,GoogleStrategy,SessionSerializer],
  controllers: [AuthController]
})
export class AuthModule {}
