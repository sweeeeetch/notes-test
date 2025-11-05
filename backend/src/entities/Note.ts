import {
  Entity,
  ObjectIdColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ObjectId,
  Index,
} from 'typeorm';

@Entity('notes')
export class Note {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column('string')
  title!: string;

  @Column('string')
  content!: string;

  @Column('string')
  category!: string | null;

  @Index()
  @Column('string')
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  get id(): string {
    return this._id.toString();
  }
}
