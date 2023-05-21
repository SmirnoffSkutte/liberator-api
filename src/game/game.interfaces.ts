export interface bet
{
    userId:number,
    betValue:number,
    autoStopKef?:number
}

export interface userTakeKef
{
    userId:number,
    takeKef:number
}

export interface autoKefBet
{
    autoKefBet:bet,
    autoKefBetIndex:number
}

export interface game
{
    gameId:number,
    gameKef:number,
}