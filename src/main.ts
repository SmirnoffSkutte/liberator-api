import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import * as passport from 'passport';
const memoryStore = require('memorystore')(session)

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api')
  app.use(session({
    secret:'fwkepker;lvlekrpovw,rvwpv,[wev',
    saveUninitialized:false,
    resave:false,
    cookie:{
      maxAge:60000
    },
    store:new memoryStore({
      checkPeriod:60000
    })
  }));
  app.use(passport.initialize());
  app.use(passport.session())
  app.enableCors();
  await app.listen(process.env.PORT || 4200);
}
bootstrap();
