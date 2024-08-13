import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, params, query, body } = req;
    const userAgent = req.get('user-agent') || '';

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');

      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent}`
      );

      if (Object.keys(params).length > 0) {
        this.logger.debug('Parameters:', JSON.stringify(params, null, 2));
      }

      if (Object.keys(query).length > 0) {
        this.logger.debug('Query:', JSON.stringify(query, null, 2));
      }

      if (Object.keys(body).length > 0) {
        this.logger.debug('Body:', JSON.stringify(body, null, 2));
      }

      this.logger.debug('---');
    });

    next();
  }
}