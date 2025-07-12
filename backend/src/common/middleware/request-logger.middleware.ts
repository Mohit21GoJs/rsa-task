import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl, headers, body } = req;
    const userAgent = headers['user-agent'] || '';
    const ip = req.ip || req.connection.remoteAddress;

    // Log request
    this.logger.log(`🔄 ${method} ${originalUrl} - ${userAgent} - ${ip}`);

    // Log sensitive data carefully
    if (body && Object.keys(body).length > 0) {
      const sanitizedBody = this.sanitizeBody(body);
      this.logger.debug(`Request body: ${JSON.stringify(sanitizedBody)}`);
    }

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      const responseSize = res.get('content-length') || 0;

      const logLevel =
        statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'log';

      this.logger[logLevel](
        `✅ ${method} ${originalUrl} ${statusCode} - ${duration}ms - ${responseSize}bytes`,
      );
    });

    next();
  }

  private sanitizeBody(body: any): any {
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***';
      }
    }

    return sanitized;
  }
}
