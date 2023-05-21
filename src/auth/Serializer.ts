import { PassportSerializer } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { Repository } from "typeorm";
import {Injectable} from '@nestjs/common'


//магическое получение юзера из сессии
@Injectable()
export class SessionSerializer extends PassportSerializer{
    constructor(@InjectRepository(User) private readonly userRepository: Repository<User>)
    {
        super();
    }
        
    serializeUser(user: User, done: Function) {
        // console.log('seriz user')
        done(null,user)
    }

    async deserializeUser(payload: User, done: Function) {
        const user=await this.userRepository.findOneBy({userId:payload.userId})
        // console.log('deser user')
        // console.log(user)
        // console.log(payload)
        return user ? done(null,user) : done(null,null)

    }
}