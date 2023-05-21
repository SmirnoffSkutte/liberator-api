import { Injectable } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { bet, userTakeKef } from './game.interfaces';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GameService {
  constructor(private readonly jwtService:JwtService,private readonly configService:ConfigService){}
  async verifyClientToken(token:string){
    let isValidToken=await this.jwtService.verifyAsync(token,{
      secret: this.configService.get('JWT_SECRET')
    })

    return isValidToken
  }

  async verifyClientTokenIgnoreExpiration(token:string){
    let isValidToken=await this.jwtService.verifyAsync(token,{
      secret: this.configService.get('JWT_SECRET'),
      ignoreExpiration:true
    })

    return isValidToken
  }

  async getUserInfoFromToken(token:string){
    const userInfo=this.jwtService.decode(token)
    return userInfo
  }

  async giveMoneyToRemaingKefs(userTakeKefs:userTakeKef[]){
    
  }
}
