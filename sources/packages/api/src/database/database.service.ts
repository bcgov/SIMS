import { Injectable, Inject } from '@nestjs/common';
import { Connection } from 'typeorm';

@Injectable()
export class DatabaseService {
  constructor(@Inject('Connection') public connection: Connection) {
    connection.query(`SET SCHEMA '${process.env.DB_SCHEMA || 'sims'}';`).then(() => {
      console.log(`*** Successfully set schema ${process.env.DB_SCHEMA || 'sims'}`);
    });
  }
}
