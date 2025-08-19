import { ExceptionFilter, Catch, NotFoundException, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';

@Catch(NotFoundException)
export class RedirectNotFoundFilter implements ExceptionFilter {
  catch(exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    res.status(404).json({
      success: false,
      message: exception.message || 'Resource not found',
      redirectUrl: '/halaman-tujuan', // ini akan dibaca FE
    });
  }
}
