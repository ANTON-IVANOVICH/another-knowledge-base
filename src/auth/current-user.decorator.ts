import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';
import { Request } from 'express';

type SafeUser = Pick<User, 'id' | 'email'>;

export const CurrentUser = createParamDecorator(
  <K extends keyof SafeUser>(
    data: K | undefined,
    ctx: ExecutionContext,
  ): SafeUser | SafeUser[K] | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as SafeUser | undefined;
    return data ? user?.[data] : user;
  },
);
