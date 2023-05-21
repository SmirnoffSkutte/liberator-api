import { Injectable ,Inject} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from "passport-google-oauth20";
import { AuthService } from "../auth.service";
import { User } from "src/user/entities/user.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { AuthDto } from "../dto/auth.dto";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {

    constructor(
        private readonly authService:AuthService,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private readonly configService:ConfigService,
        ){
        super({
            clientID:configService.get('GOOGLE_CLIENT_ID'),
            clientSecret:configService.get('GOOGLE_CLIENT_SECRET'),
            callbackURL:configService.get('GOOGLE_CALLBACK_URL'),
            scope:['profile','email'],
        });
    }

    //происходит после редиректа гугла после успешного входа в гугл аккаунт,т.е. все снизу 100% всегда правильное,так как перед этим была проверка гугла
    async validate(accessToken:string,refreshToken:string,profile:Profile){
        //проверяем,есть ли такой пользователь,если такого нет-то регистрируем,иначе возвращаем
        //найденного юзера c парой токенов      всем юзерам гугла/вк и т.д. хоть и не нужны пароли,но мы их будем генерировать,дабы не делать
        //отдельную схему юзеров для них    в email для этих юзеров будем записывать имя из соцсети,если это не рег через гугл
        const user=await this.userRepository.findOneBy({email:profile.emails[0].value})
        if (user){
            //обновляем юзеру все поля кроме баланса,ника,пароля,email,т.е только аватарку
            const waitingUpdates=await this.userRepository.createQueryBuilder().update(User).set({avatarLink:profile.photos[0].value,}).where("userId=:userId",{userId:user.userId}).execute()
            const loginDto:AuthDto={
                email:profile.emails[0].value,
                password:this.configService.get('SUPER_SECRET_PASSWORD_FOR_OAUTH')
            }
            return this.authService.login(loginDto)
        } else {
            const registerDto:AuthDto={
                email:profile.emails[0].value,
                password:this.configService.get('SUPER_SECRET_PASSWORD_FOR_OAUTH')
            }
            const newUser=await this.authService.register(registerDto)
            const waitingUpdates=await this.userRepository.createQueryBuilder().update(User).set({avatarLink:profile.photos[0].value,nickname:profile.displayName}).where("userId=:userId",{userId:newUser.user.userId}).execute()
            const finalNewUser=await this.authService.login(registerDto)
            return finalNewUser
        }
    }
}