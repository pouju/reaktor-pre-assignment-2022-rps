import { Schema, model } from 'mongoose';
import { CursorObject } from '../types';

const cursorSchema = new Schema<CursorObject>({
  cursor: {
    type: String,
    required: true
  },
});

cursorSchema.set('toJSON', {
  transform: (_document, returnObject) => {
    delete returnObject._id;
    delete returnObject.__v;
  }
});

export default model('CursorModel', cursorSchema);
