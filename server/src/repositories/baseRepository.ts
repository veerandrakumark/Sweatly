import { Model, Document, FilterQuery, UpdateQuery } from 'mongoose';

// Base generic repository interface defining CRUD operations
export interface IBaseRepository<T extends Document> {
  create(item: Partial<T>): Promise<T>;
  update(id: string, item: UpdateQuery<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  findById(id: string): Promise<T | null>;
  findOne(filter: FilterQuery<T>): Promise<T | null>;
  findAll(
    filter?: FilterQuery<T>,
    options?: { page?: number; limit?: number; sort?: any }
  ): Promise<T[]>;
  count(filter?: FilterQuery<T>): Promise<number>;
}

// Reusable base class implementing generic Mongoose operations
export abstract class BaseRepository<T extends Document> implements IBaseRepository<T> {
  protected readonly model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(item: any): Promise<T> {
    return this.model.create(item);
  }

  async update(id: string, item: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, item, { new: true, runValidators: true }).exec();
  }

  // Soft delete implementation by default
  async delete(id: string): Promise<boolean> {
    const updated = await this.model
      .findByIdAndUpdate(id, {
        isDeleted: true,
        deletedAt: new Date(),
      } as any)
      .exec();
    return !!updated;
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(filter).exec();
  }

  async findAll(
    filter: FilterQuery<T> = {},
    options: { page?: number; limit?: number; sort?: any } = {}
  ): Promise<T[]> {
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    return this.model.find(filter).sort(sort).skip(skip).limit(limit).exec();
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }
}
