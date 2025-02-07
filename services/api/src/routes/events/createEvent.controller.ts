import * as endpoints from "@econnessione/shared/endpoints";
import { EventEntity } from "@entities/Event.entity";
import { foldOptionals } from "@utils/foldOptionals.utils";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import { Route } from "routes/route.types";
import { AddEndpoint } from "ts-endpoint-express";
import { toEventIO } from "./event.io";

export const MakeCreateEventRoute: Route = (r, { s3, db, env }) => {
  AddEndpoint(r)(
    endpoints.Event.Create,
    ({ body: { endDate, images, ...body } }) => {
      const optionalData = pipe(foldOptionals({ endDate }), (data) => ({
        ...data,
        groups: body.groups.map((id) => ({ id })),
        actors: body.actors.map((id) => ({ id })),
        groupMembers: body.groupMembers.map((id) => ({ id })),
      }));

      return pipe(
        db.save(EventEntity, [{ ...body, ...optionalData }]),
        TE.chain(([event]) =>
          db.findOneOrFail(EventEntity, {
            where: { id: event.id },
            loadRelationIds: true,
          })
        ),
        TE.chain((event) => TE.fromEither(toEventIO(event))),
        TE.map((data) => ({
          body: {
            data,
          },
          statusCode: 201,
        }))
      );
    }
  );
};
