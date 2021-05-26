import {Arg, Ctx, Field, InputType, Mutation, ObjectType, Resolver} from 'type-graphql'
import { User } from '../entities/User'
import {MyContext} from '../types'
import argon2 from 'argon2'


@InputType()
class UserSignUp {
  @Field()
  username: string
  @Field()
  password: string
}

@ObjectType()
class FieldError{
  @Field()
  field: string
  @Field()
  msg: string
}

@ObjectType()
class LoginResponse {
  @Field(() => [FieldError], {nullable: true})
  errors?: FieldError[]

  @Field(() => User, {nullable: true})
  user?: User
}

@Resolver()
export class UserResolver{
  @Mutation(() => User)
    async register(
      @Ctx() {em}: MyContext,
      @Arg('userInputs') userInputs: UserSignUp
      ){
        const hashedP = await argon2.hash(userInputs.password)
        const user = em.create(User, {
          username: userInputs.username, 
          password: hashedP
        })
        await em.persistAndFlush(user)
        return user
  }

  @Mutation(() => LoginResponse)
    async login(
      @Ctx() {em}: MyContext,
      @Arg('userInputs') userInputs: UserSignUp
      ): Promise<LoginResponse> 
      {
        const user = await em.findOne(User, {
          username: userInputs.username
        })
        if(!user) {
          return {
            errors: [{
              field: 'username',
              msg: `Username doesn't exist`
            }]
          }
        }
        const valid = await argon2.verify(user.password , userInputs.password)
        if(!valid) {
          return {
            errors: [{
              field: 'password',
              msg: `Incorrect password`
            }]
          }
        }
        return {
          user
        }
      }
}
  