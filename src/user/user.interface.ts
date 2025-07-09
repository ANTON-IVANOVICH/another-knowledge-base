import { Role } from '@prisma/client';

export interface UserPayload {
  id: string;
  email: string;
  role: Role;
}

export interface UserRequest extends Request {
  user: UserPayload;
}
