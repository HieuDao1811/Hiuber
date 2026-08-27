export enum Status {
  ACTIVE = 'active',
  DELETED = 'deleted'
}

export enum Role {
  ADMIN = 'admin',
  CUSTOMER = 'customer'
}

export interface TokenPayload {
  sub: string,
  role: Role
}

export interface ListResult<T> {
  data: T[];
  total: number;
}