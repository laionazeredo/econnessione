import * as endpoints from "@econnessione/shared/endpoints";
import { ActorEntity } from "@entities/Actor.entity";
import { foldOptionals } from "@utils/foldOptionals.utils";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import { Route } from "routes/route.types";
import { AddEndpoint } from "ts-endpoint-express";
import { toActorIO } from "./actor.io";

export const MakeEditActorRoute: Route = (r, { s3, db, env, logger }) => {
  AddEndpoint(r)(
    endpoints.Actor.Edit,
    ({ params: { id }, body }) => {
      const updateData = foldOptionals(body as any);
      logger.debug.log("Actor update data %O", updateData);
      return pipe(
        db.update(ActorEntity, id, updateData),
        TE.chain(() =>
          db.findOneOrFail(ActorEntity, {
            where: { id },
            loadRelationIds: true,
          })
        ),
        TE.chainEitherK(toActorIO),
        TE.map((actor) => ({
          body: {
            data: actor,
          },
          statusCode: 200,
        }))
      );
    }
  );
};
