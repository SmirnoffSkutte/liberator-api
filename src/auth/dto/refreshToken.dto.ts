import { IsString } from "class-validator";

export class RefreshTokenDto {
    @IsString({
        message:'refreshToken не строка'
    })
    refreshToken: string
}