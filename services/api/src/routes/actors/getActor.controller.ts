import * as endpoints from "@econnessione/shared/endpoints";
import { Router } from "express";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import { RouteContext } from "routes/route.types";
import { AddEndpoint } from "ts-endpoint-express";
import { ActorEntity } from "../../entities/Actor.entity";
import { toActorIO } from "./actor.io";

export const MakeGetActorRoute = (r: Router, ctx: RouteContext): void => {
  AddEndpoint(r)(endpoints.Actor.Get, ({ params: { id } }) => {
    return pipe(
      ctx.db.findOneOrFail(ActorEntity, {
        where: { id },
        loadRelationIds: true,
      }),
      TE.chainEitherK(toActorIO),
      TE.map((actor) => ({
        body: {
          data: actor,
        },
        statusCode: 200,
      }))
    );
  });
};
