import { Entity, ObjectIdColumn, Column, CreateDateColumn, ObjectId } from 'typeorm';

@Entity('users')
export class User {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column({ type: 'string', unique: true })
  email!: string;

  @Column({ type: 'string' })
  password!: string;

  @CreateDateColumn()
  createdAt!: Date;

  get id(): string {
    return this._id.toString();
  }
}
