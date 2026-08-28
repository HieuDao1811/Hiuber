export interface ProfileQuery {
  id: string
}

export interface IUserQueryHandler<Query, Result> {
  query(query: Query): Promise<Result>;
}