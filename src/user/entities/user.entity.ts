import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
@Entity({
  name:'users'
})
export class User {
  @PrimaryGeneratedColumn()
  userId:number;

  @Column({nullable:true})
  nickname:string;

  @Column({unique:true})
  email: string;

  @Column()
  password:string;

  @Column({default:0})
  balance:number

  @Column({nullable:true})
  avatarLink:string
}
