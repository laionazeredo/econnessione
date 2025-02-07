import * as endpoints from "@econnessione/shared/endpoints";
import { GroupMemberEntity } from "@entities/GroupMember.entity";
import { getORMOptions } from "@utils/listQueryToORMOptions";
import { Router } from "express";
import { sequenceS } from "fp-ts/lib/Apply";
import * as A from "fp-ts/lib/Array";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import { RouteContext } from "routes/route.types";
import { AddEndpoint } from "ts-endpoint-express";
import { toGroupMemberIO } from "./groupMember.io";

export const MakeListGroupMemberRoute = (
  r: Router,
  ctx: RouteContext
): void => {
  AddEndpoint(r)(endpoints.GroupMember.List, ({ query }) => {
    const findOptions = getORMOptions(query, ctx.env.DEFAULT_PAGE_SIZE);

    ctx.logger.debug.log(`find Options %O`, findOptions);

    return pipe(
      sequenceS(TE.taskEither)({
        data: pipe(
          ctx.db.find(GroupMemberEntity, {
            ...findOptions,
            relations: ["actor", "group"],
          }),
          TE.chainEitherK(A.traverse(E.either)(toGroupMemberIO))
        ),
        count: ctx.db.count(GroupMemberEntity),
      }),
      TE.map(({ data, count }) => ({
        body: {
          data: data,
          total: count,
        },
        statusCode: 200,
      }))
    );
  });
};
