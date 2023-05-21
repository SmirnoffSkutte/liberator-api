import { Session } from "express-session";

export interface SessionCookie {
    originalMaxAge:number,
	expires:Date,
	httpOnly: boolean,
	path:string
}

export interface PassportUser {
    user:{
        userId:number,
        email:string,
        balance:number,
        avatarLink:string,
        nickname:string
    },
    refreshToken:string,
    accessToken:string
}

export interface SessionPassport {
    user:PassportUser
}

export interface ISession extends Session {
  cookie:SessionCookie,
  passport:SessionPassport
}