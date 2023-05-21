import { WebSocketGateway, SubscribeMessage, MessageBody, OnGatewayConnection, WebSocketServer,OnGatewayInit, ConnectedSocket} from '@nestjs/websockets';
import { GameService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { Server ,Socket} from 'socket.io';
import { autoKefBet, bet, game, userTakeKef } from './game.interfaces';
import {BadRequestException, UseGuards,UnauthorizedException} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { UserService } from 'src/user/user.service';

@WebSocketGateway({
  cors:{
    origin:'http://localhost:3000'
  }
})
export class GameGateway implements OnGatewayConnection,OnGatewayInit{
  private currentGame:game;
  private currentGameKef:number;
  private isGameStarted:boolean=false;
  private isGameTakingBets:boolean=true;
  private currentTimer:number=0;
  private timeToNextGame:number=10;

  private winsAmountTotal:number=0;
  private loseAmountTotal:number=0;
  private winsAmountCurrentGame:number=0;
  private loseAmountCurrentGame:number=0;
    
  private botsBetsCurrentGame:bet[]=[];
  private usersBetsCurrentGame:bet[]=[];
  private usersTakeKefs:userTakeKef[]=[];
  constructor(
    private readonly gameService:GameService,
    private readonly userService:UserService
  ) {}
    
  @WebSocketServer() 
  server:Server;

  afterInit(){
    console.log('initailization of gateway')
    this.winsAmountTotal=0
    this.loseAmountTotal=0
    this.winsAmountCurrentGame=0
    this.loseAmountCurrentGame=0
    this.isGameTakingBets=true
    this.isGameStarted=false
    // если включить setinterval,то сервер мрет
    // setInterval(,10000);
  }

  

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Connection from ${client.id}`)
    //дать нужные данные текущего игрового процесса
  }

  async testGame(){
    // this.isGameStarted=true
    // await this.startGame()
    console.log('first bet')
    this.server.emit('newBet',this.usersBetsCurrentGame[0])
    let kef=1;
    let load=0;
    this.server.emit('gameTakingBets')
    const wsServer=this.server
    function intervalLoading(){
      return new Promise(function(resolve,reject){
        const intLoad=setInterval(()=>{
          load=load+1
          console.log('loading')
          wsServer.emit('currentLoadingProgress',load)
          if(load===10){
            clearInterval(intLoad)
            resolve(true)
          }
        },1000)
      })
    }
    await intervalLoading()
    .then(res=>{
      this.server.emit('gameClosingBets')
      this.server.emit('gameStarting')
      console.log('game started')
    })
    function intervalKeffing(){
      return new Promise(function(resolve,reject){
        const intKef=setInterval(()=>{
          kef=kef+0.1
          console.log('keffing')
          wsServer.emit('keffing',kef)
          let notFloatKef=Number(kef.toFixed(3))
          if(notFloatKef===3.8){
            clearInterval(intKef)
            resolve(true)
          }
        },500)
      })
    }
    await intervalKeffing().then(res=>{
      this.server.emit('gameEnded')
      setTimeout(()=>{
        this.server.emit('gameTakingBets')
      },3500)
      console.log('game endeding')
    })
    this.usersBetsCurrentGame=[]
  }
  
  async startGame() {
      //calculate loses
      if(this.isGameStarted===true){
        this.usersBetsCurrentGame.forEach((userBet)=>{
          let userBetValue=userBet.betValue
          this.loseAmountCurrentGame=this.loseAmountCurrentGame+userBetValue
        })
      }
      //считаем после какой суммы денег заканчивать игру
      const gameEnd_moneyAmountLeft=this.loseAmountCurrentGame*0.15
      //находим ставки с автокэфами,чтобы потом не искать их во время цикла счета игры
      let autoKefBets:autoKefBet[]=[]
      this.usersBetsCurrentGame.forEach((userBet,userBetIndex)=>{
        if(userBet.autoStopKef){
          autoKefBets.push({autoKefBet:userBet,autoKefBetIndex:userBetIndex})
        }
      })
      //считаем в цикле,когда заканчивать игру
      while(this.isGameStarted===true){
        //заносим автокэфы в userTakeKefs,если кэф игры стал таким же
        autoKefBets.forEach((avtoBet)=>{
          if(avtoBet.autoKefBet.autoStopKef===this.currentGameKef){
            this.usersTakeKefs.push({userId:avtoBet.autoKefBet.userId,  takeKef:avtoBet.autoKefBet.autoStopKef})
          }
        })
        //перебираем пришедшие кэфы на текущий рост 0.01
        // let maxPossibleWin=0;
        while(this.usersTakeKefs.length>0){
          this.usersTakeKefs.forEach((userTakeKef,userTakeKefIndex)=>{
            let userIdKef=userTakeKef.userId
            let userKefValue=userTakeKef.takeKef
            // находим к какой ставке относится кэф
            let betIndex=0;
            let userBet=this.usersBetsCurrentGame.filter((userBet,userBetIndex)=>{
              betIndex=userBetIndex
              return (userTakeKef.userId===userBet.userId && userTakeKef.takeKef===this.currentGameKef)
            })
            
            if(userBet.length>0){
              let winValue=userBet[0].betValue*userKefValue
              this.winsAmountCurrentGame=this.winsAmountCurrentGame+winValue;
              this.loseAmountCurrentGame=this.loseAmountCurrentGame-winValue;
              this.usersBetsCurrentGame.splice(betIndex,1)
              this.usersTakeKefs.splice(userTakeKefIndex,1)
            } else {
              this.usersTakeKefs.splice(userTakeKefIndex,1)
            }
            //если денег в игре больше не хватает,то останавливаем игру и раздаем деньги всем,кто успел к данному кэфу
            if(this.loseAmountCurrentGame==gameEnd_moneyAmountLeft || this.loseAmountCurrentGame<gameEnd_moneyAmountLeft){
              this.isGameStarted=false
              this.server.emit('gameIsDone')
              //раздаем деньги оставшимся успевшим takeKefs
              this.usersTakeKefs.forEach(()=>{
                
              })
            }
          })
        }
        this.currentGameKef=this.currentGameKef+0.01       
    }
  }
  
  //проверять токен,на всякий случай,если будут лаги,то можно будет убрать,т.к. есть проверка на фронте
  @SubscribeMessage('betToGame')
  async betToGame(@ConnectedSocket() client: Socket,@MessageBody() bet:bet) {
    // console.log(client.id)
    let clientToken=client.handshake.auth.token
    console.log(clientToken)
    let isValidClientToken;
    if(typeof clientToken==="string"){
      isValidClientToken=await this.gameService.verifyClientToken(clientToken)
    }
    // console.log(isValidClientToken)
    // console.log(bet)
    if(!isValidClientToken){
      throw new UnauthorizedException('нет авторизации сокета')
    }

    if(this.isGameStarted===true){
      throw new BadRequestException('игра уже началась')
    }
    //Если никого ставок нет,то начинаем игру,иначе просто докидываем в ставки
    if(this.usersBetsCurrentGame.length===0){
      this.userService.updateUserBalance(bet.userId,bet.betValue)
      this.usersBetsCurrentGame.push(bet)
      // this.server.emit("newBet",bet)
      console.log(this.usersBetsCurrentGame)
      await this.testGame()
    } else {
      this.userService.updateUserBalance(bet.userId,bet.betValue)
      this.usersBetsCurrentGame.push(bet)
    }
  }

  //токен ОБЯЗАТЕЛЬНО проверять,т.к. все сайты уязвимы через консоль разработчика
  //если будут лаги забирания кэфов,тогда буду думать
  @SubscribeMessage('takeKefGame')
  async takeKefGame(@ConnectedSocket() client: Socket,@MessageBody() userTakeKef:userTakeKef) {
    let clientToken=client.handshake.auth.token
    let isValidClientToken;
    if(typeof clientToken==="string"){
      isValidClientToken=await this.gameService.verifyClientTokenIgnoreExpiration(clientToken)
    }
    if(!isValidClientToken){
      throw new UnauthorizedException('нет авторизации сокета')
    }
    this.usersTakeKefs.push(userTakeKef)
  }
}
