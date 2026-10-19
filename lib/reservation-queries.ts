import { sql } from "../db/sql.ts";

// One conditional UPDATE per transition; never replace these with read/write pairs.
export const reservationSql = {
  reserve: (token: string, expires: number, id: string, now: number) => sql`UPDATE wishes SET state='reserved',token=${token},expires=${expires},extended=0 WHERE id=${id} AND paused=0 AND (state='available' OR (state='reserved' AND expires<=${now})) AND (SELECT COUNT(*) FROM wishes WHERE token=${token} AND state='reserved' AND expires>${now}) < 10 RETURNING id`,
  extend: (id: string, token: string, now: number) => sql`UPDATE wishes SET expires=expires+86400000,extended=1 WHERE id=${id} AND token=${token} AND state='reserved' AND expires>${now} AND extended=0 RETURNING id`,
  purchase: (id: string, token: string, now: number) => sql`UPDATE wishes SET state='purchased',expires=NULL WHERE id=${id} AND token=${token} AND state='reserved' AND expires>${now} RETURNING id`,
  release: (id: string, token: string) => sql`UPDATE wishes SET state='available',token=NULL,expires=NULL,extended=0 WHERE id=${id} AND token=${token} AND state IN ('reserved','purchased') RETURNING id`,
};
