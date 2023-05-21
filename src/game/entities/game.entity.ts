import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
@Entity()
export class Game {
  @PrimaryGeneratedColumn()
  gameId:number;

  @Column()
  stopKef: number;

  @Column()
  playersBets:string;
}
