import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map((e) => e.message).join(', ');
        return res.status(400).json({
          success: false,
          error: message,
          code: 'VALIDATION_ERROR',
        });
      }
      next(error);
    }
  };
}

/**
 * Multipart-aware validator. Coerces string fields (multer sends everything as string) into expected types
 * before running the schema, then mutates req.body in place so the controller gets clean values.
 * Pass `numericFields` (parseFloat) and `jsonFields` (JSON.parse — for arrays/objects sent as JSON strings).
 */
export function validateMultipart(
  schema: ZodSchema,
  opts: { numericFields?: string[]; jsonFields?: string[]; intFields?: string[] } = {}
) {
  const { numericFields = [], jsonFields = [], intFields = [] } = opts;
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      for (const f of jsonFields) {
        if (typeof req.body[f] === 'string') {
          try { req.body[f] = JSON.parse(req.body[f]); } catch { req.body[f] = []; }
        }
      }
      for (const f of intFields) {
        if (typeof req.body[f] === 'string' && req.body[f] !== '') {
          const n = parseInt(req.body[f]);
          if (!Number.isNaN(n)) req.body[f] = n;
        }
      }
      for (const f of numericFields) {
        if (typeof req.body[f] === 'string' && req.body[f] !== '') {
          const n = parseFloat(req.body[f]);
          if (!Number.isNaN(n)) req.body[f] = n;
        }
      }
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return res.status(400).json({
          success: false,
          error: message,
          code: 'VALIDATION_ERROR',
        });
      }
      next(error);
    }
  };
}
