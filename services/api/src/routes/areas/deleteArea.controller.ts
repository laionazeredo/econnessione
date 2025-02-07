import * as endpoints from "@econnessione/shared/endpoints";
import { AreaEntity } from "@entities/Area.entity";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import { Route } from "routes/route.types";
import { AddEndpoint } from "ts-endpoint-express";
import { toAreaIO } from "./Area.io";

export const MakeDeleteAreaRoute: Route = (r, { s3, db, env }) => {
  AddEndpoint(r)(endpoints.Area.Delete, ({ params: { id } }) => {
    return pipe(
      db.findOneOrFail(AreaEntity, {
        where: { id },
        loadRelationIds: true,
      }),
      TE.chainFirst(() => db.delete(AreaEntity, id)),
      TE.chainEitherK(toAreaIO),
      TE.map((page) => ({
        body: {
          data: page,
        },
        statusCode: 200,
      }))
    );
  });
};
