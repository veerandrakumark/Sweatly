import { Schema, Document } from 'mongoose';

// Base document interface for strict typing across all models
export interface IBaseDocument extends Document {
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

// Reusable schema definition block
export const baseSchemaFields = {
  isDeleted: {
    type: Boolean,
    default: false,
    required: true,
    index: true, // Speeds up queries excluding deleted records
  },
  deletedAt: {
    type: Date,
    required: false,
  },
};

// Reusable plugin to hook pre-query middleware to filter out soft deleted records
export const softDeletePlugin = (schema: Schema) => {
  schema.add(baseSchemaFields);

  // Exclude soft-deleted records from standard queries
  const excludeDeleted = function (this: any, next: () => void) {
    const filter = this.getFilter();
    if (filter.isDeleted === undefined) {
      this.where({ isDeleted: false });
    }
    next();
  };

  schema.pre('find', excludeDeleted);
  schema.pre('findOne', excludeDeleted);
  schema.pre('findOneAndUpdate', excludeDeleted);
  schema.pre('countDocuments', excludeDeleted);
};
