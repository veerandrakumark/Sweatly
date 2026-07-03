import { z } from 'zod';
import { AppError } from '../utils/appError.js';

export class ValidationService {
  /**
   * Validates data against a Zod schema.
   * Throws a 400 AppError with detailed message if validation fails.
   */
  static validate<T>(schema: z.Schema<T>, data: unknown): T {
    const result = schema.safeParse(data);
    if (!result.success) {
      const firstError = result.error.errors[0];
      const path = firstError.path.join('.');
      throw new AppError(`Validation error on field [${path}]: ${firstError.message}`, 400);
    }
    return result.data;
  }
}
