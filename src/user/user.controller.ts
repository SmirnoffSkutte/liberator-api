import { Controller,UnauthorizedException,Body} from '@nestjs/common';
import { UserService } from './user.service';
import { Get,Headers,Param, Post, UseGuards} from '@nestjs/common/decorators';
import { AuthGuard } from 'src/auth/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { GoogleAuthGuard } from 'src/auth/guards/googleAuth.guard';
import { changeBalanceDto } from './dto/user.dtos';

@Controller('user')
export class UserController {
    constructor(private readonly UserService:UserService,private readonly jwtService:JwtService){}

    @UseGuards(AuthGuard)
    @Get('byId/:userId')
    async getUser(@Param('userId') userId:number,@Headers('Authorization') authHeader: string){
        const [type,token]=authHeader.split(' ')
        const tokenInfo=this.jwtService.decode(token)
        if(typeof tokenInfo==='object'){
            console.log(tokenInfo.userId)
            if(tokenInfo.userId != userId){
                throw new UnauthorizedException('У вас нет доступа к этому роуту')
            }
        }
        return this.UserService.byId(userId)
    }

    @UseGuards(AuthGuard)
    @Post('update-balance')
    async updateUserBalance(@Body() changeBalanceDto:changeBalanceDto ,@Headers('Authorization') authHeader: string){
        const userId=changeBalanceDto.userId
        const changeBalance=changeBalanceDto.changeBalance
        const [type,token]=authHeader.split(' ')
        const tokenInfo=this.jwtService.decode(token)
        if(typeof tokenInfo==='object'){
            console.log(tokenInfo.userId)
            if(tokenInfo.userId != userId){
                throw new UnauthorizedException('Нет прав к этому пользователю')
            }
        }
        return this.UserService.updateUserBalance(userId,changeBalance)
    }

    @Get('users')
    async getAllUsers(){
        return this.UserService.getAllUsers()
    }
}
