import * as t from "io-ts";
import { DateFromISOString, optionFromNullable } from "io-ts-types";
import { Endpoint } from "ts-endpoint";
import { nonEmptyRecordFromType } from "../io/Common/NonEmptyRecord";
import * as http from "../io/http";
import { ListOutput, Output } from "../io/http/Common/Output";
import { GetListQuery } from "../io/http/Query";

const SingleGroupMemberOutput = Output(
  http.GroupMember.GroupMember,
  "GroupMember"
);
const ListGroupMemberOutput = ListOutput(
  http.GroupMember.GroupMember,
  "ListGroupMember"
);

export const List = Endpoint({
  Method: "GET",
  getPath: () => "/groups-members",
  Input: {
    Query: {
      ...GetListQuery.props,
      group: optionFromNullable(t.string),
    },
  },
  Output: ListGroupMemberOutput,
});

const CreateBody = t.strict(
  {
    group: t.string,
    actor: t.string,
    startDate: DateFromISOString,
    endDate: optionFromNullable(DateFromISOString),
    body: t.string,
  },
  "CreateGroupMemberBody"
);

export const Create = Endpoint({
  Method: "POST",
  getPath: () => "/groups-members",
  Input: {
    Query: undefined,
    Body: CreateBody,
  },
  Output: SingleGroupMemberOutput,
});

export const Get = Endpoint({
  Method: "GET",
  getPath: ({ id }) => `/groups-members/${id}`,
  Input: {
    Query: undefined,
    Params: { id: t.string },
  },
  Output: SingleGroupMemberOutput,
});

export const Edit = Endpoint({
  Method: "PUT",
  getPath: ({ id }) => `/groups-members/${id}`,
  Input: {
    Query: undefined,
    Params: { id: t.string },
    Body: nonEmptyRecordFromType({
      group: optionFromNullable(t.string),
      actor: optionFromNullable(t.string),
      startDate: optionFromNullable(DateFromISOString),
      endDate: optionFromNullable(DateFromISOString),
      body: optionFromNullable(t.string),
    }),
  },
  Output: SingleGroupMemberOutput,
});

export const Delete = Endpoint({
  Method: "DELETE",
  getPath: ({ id }) => `/groups-members/${id}`,
  Input: {
    Query: undefined,
    Params: { id: t.string },
  },
  Output: SingleGroupMemberOutput,
});
