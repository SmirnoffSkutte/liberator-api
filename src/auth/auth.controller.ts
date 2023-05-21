import { Body, Controller, Get, HttpCode, Post, UseGuards, UsePipes,ValidationPipe,Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthDto } from "./dto/auth.dto";
import { RefreshTokenDto } from "./dto/refreshToken.dto";
import { GoogleAuthGuard } from "./guards/googleAuth.guard";
import { Request } from "express";
import { ISession } from "./interfaces";
import { ConfigService } from "@nestjs/config";
import { MemoryStore } from "express-session";

@Controller('auth')
export class AuthController {
    constructor(private readonly AuthService:AuthService,private readonly configService:ConfigService){}

    @UsePipes(new ValidationPipe())
    @HttpCode(200)
    @Post('login')
    async login(@Body() dto:AuthDto){
     return this.AuthService.login(dto)
     }

    @UsePipes(new ValidationPipe())
    @HttpCode(200)
    @Post('refresh')
    async getNewTokens(@Body() dto:RefreshTokenDto){
     return this.AuthService.getNewTokens(dto.refreshToken)
     }

    @UsePipes(new ValidationPipe())
    @HttpCode(200)
    @Post('registration')
    async register(@Body() dto:AuthDto){
     return this.AuthService.register(dto)
     }


    @Get('google-registration')
    @UseGuards(GoogleAuthGuard)
    async googleRegister() {
     //перенесемся на страницу выбора аккаунта гугл,затем редирект
    }
    @Get('google-login')
    @UseGuards(GoogleAuthGuard)
    async googleLogin() {
     //перенесемся на страницу выбора аккаунта гугл,затем редирект
    }

    //после логина или регистрации через гугл сделается запрос сюда,здесь мы получаем всю инфу о новом зареганном/логиненном юзере из гугла
    @HttpCode(200)
    @Get('google-redirect')
    @UseGuards(GoogleAuthGuard)
    async googleRedirect(@Req() request:Request) {
        return (request.session as ISession).passport.user
    }
}
