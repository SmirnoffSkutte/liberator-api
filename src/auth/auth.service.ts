import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthDto } from "./dto/auth.dto";
import {hash,genSalt,compare} from 'bcryptjs'
import { JwtService } from "@nestjs/jwt";
import { RefreshTokenDto } from "./dto/refreshToken.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";


@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private readonly userRepository:Repository<User>,
        private readonly jwtService: JwtService,
        private readonly configService:ConfigService
    ){}

    async register(dto:AuthDto) {
        const oldUser = await this.userRepository.findOne({
            where:{email:dto.email}
        })
        if(oldUser){
            throw new BadRequestException(`Уже есть пользователь с email ${dto.email}`)
        }
        const salt= await genSalt(10)

        const newUser = this.userRepository.create({
            email:dto.email,
            password:await hash(dto.password,salt),
        })

        const user = await this.userRepository.save(newUser);
        const email=user.email
        const nickname=email.split('@')[0]
        const waitingUpdates=await this.userRepository.createQueryBuilder().update(User).set({nickname:nickname}).where("userId=:userId",{userId:user.userId}).execute()
        const finalUser=await this.userRepository.findOne({
            where:{userId:user.userId}
        })

        const tokens=await this.issueTokenPair(user.userId)
        
        return {
            user: this.returnUserFields(finalUser),
            ...tokens
        }
    }

    async login(dto:AuthDto){
        const user = await this.validateUser(dto)
        
        const tokens=await this.issueTokenPair(user.userId)
        return {
            user: this.returnUserFields(user),
            ...tokens
        }
    }

    async getNewTokens(refreshToken:string){
     try {
        if(!refreshToken) throw new UnauthorizedException('Нет рефреш токена')

        const result = await this.jwtService.verifyAsync(refreshToken,{
            secret:this.configService.get('JWT_SECRET')
        })
        
        if(!result){
            throw new UnauthorizedException('Токен неверен или закончился')
        }

        const user = await this.userRepository.findOne({
            where:{userId:result.userId}
        })
        if(!user){
            throw new UnauthorizedException('По токену не было найдено такого пользователя')
        }
        const tokens = await this.issueTokenPair(user.userId)

        return {
            ...tokens
        }
     } catch (error) {
        throw new UnauthorizedException(error);
     }
    }

    async validateUser(dto:AuthDto):Promise<User>{
        const user = await this.userRepository.findOne({
            where:{email:dto.email}
        })
        if(!user) throw new UnauthorizedException(`Пользователь c email ${dto.email} не найден`)

        const isValidPassword= await compare(dto.password,user.password)
        if(!isValidPassword) throw new UnauthorizedException('Неправильный пароль')

        return user
    }

    async issueTokenPair(userId:number){
        const data = {userId:userId}

        const refreshToken = await this.jwtService.signAsync(data,{
            expiresIn:'15d'
        })

        const accessToken = await this.jwtService.signAsync(data,{
            expiresIn:'4h'
        })

        return{refreshToken,accessToken}

    }

    returnUserFields(user:User){
        return{
            userId:user.userId,
            email:user.email,
            balance:user.balance,
            avatarLink:user.avatarLink,
            nickname:user.nickname
        }

    }
}
