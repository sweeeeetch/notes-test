import { ObjectId } from 'mongodb';

export interface Note {
  _id?: ObjectId;
  title: string;
  content: string;
  category: string | null;
  userId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteDocument extends Note {
  _id: ObjectId;
}
