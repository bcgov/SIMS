import { Repository, Connection } from "typeorm";

export async function saveInDB<T> (object: T, connection: Connection, entity: any) {
  const repo: Repository<T> = connection.getRepository(entity);
  await repo.save(object);
}