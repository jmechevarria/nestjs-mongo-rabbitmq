import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { isAxiosError } from 'axios';
import { Request, Response } from 'express';

type MyResponseObject = {
  statusCode: number;
  timestamp: string;
  path: string;
  response: string | object;
};

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const myResponseObject: MyResponseObject = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      path: request.url,
      response: '',
    };

    console.log(exception.constructor, typeof exception);
    if (exception instanceof HttpException) {
      myResponseObject.statusCode = exception.getStatus();
      myResponseObject.response = exception.getResponse();
    } else if (isAxiosError(exception)) {
      myResponseObject.statusCode = exception.response?.status || 500;
      myResponseObject.response =
        exception.response?.statusText ||
        exception.message ||
        'Unknown axios error';
    } else if ((exception as { name: string }).name === 'MongoServerError') {
      myResponseObject.statusCode = 400;
      myResponseObject.response = `${this.translateMongoDBErrorCode(
        (exception as { code: number }).code,
      )}: ${Object.keys((exception as { keyValue: string }).keyValue)}`;
    } else {
      myResponseObject.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      myResponseObject.response = new InternalServerErrorException().message;
    }

    response.status(myResponseObject.statusCode).json(myResponseObject);

    console.error(myResponseObject.response, AllExceptionsFilter.name);

    super.catch(exception, host);
  }

  private translateMongoDBErrorCode(code: number) {
    switch (code) {
      case 11000:
        return 'Duplicate key';
      default:
        return 'Unknown database error';
    }
  }
}
