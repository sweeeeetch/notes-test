import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  email: string;
  password: string;
  createdAt: Date;
}

export interface UserDocument extends User {
  _id: ObjectId;
}
