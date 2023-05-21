import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { genSalt, hash } from "bcryptjs";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { UpdateUserDto } from "./update-user.dto";

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        )
    {}

    async byId(id:number){
        const user = await this.userRepository.findOne({
            where:{userId:id}
        })
        if(!user) throw new NotFoundException('Пользователь не найден')

        const userFields={
            userId:user.userId,
            email:user.email,
            balance:user.balance,
            avatarLink:user.avatarLink,
            nickname:user.nickname
        }

        return userFields
    }

    async getAllUsers(){
        return this.userRepository.find()
    }

    // async updateProfile(id:number,dto:UpdateUserDto){
    //     const user = await this.byId(id)
    //     const isSameUser = await this.userRepository.findOne({
    //         where:{}
    //     })

    //     if(isSameUser && String(_id) !== String(isSameUser._id)){
    //         throw new NotFoundException('Email занят')
    //     }
    //     if(dto.password){
    //         const salt = await genSalt(10)
    //         user.password = await hash(dto.password,salt)
    //     }

    //     user.email=dto.email
    //     if(dto.isAdmin || dto.isAdmin === false){
    //         user.isAdmin = dto.isAdmin
    //     }

    //     await user.save()
    //     return
    // }

    async updateUserBalance(userId:number,balanceChange:number){
        const currentUserBalance=(await this.byId(userId)).balance
        const difference=currentUserBalance+(balanceChange)
        let isCanBeUpdated:boolean;
        if(difference<0){
            throw new BadRequestException('У вас нет столько денег')
        }
        const newBalance=currentUserBalance+(balanceChange)
        const waitingUpdates=await this.userRepository.createQueryBuilder().update(User).set({balance:newBalance}).where("userId=:userId",{userId:userId}).execute()
        return waitingUpdates
    }

}
