export interface QueryHandler<Query, Result> {
  query(query: Query): Promise<Result>;
}
