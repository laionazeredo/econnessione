import * as http from "@econnessione/core/http";
import * as E from "fp-ts/lib/Either";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import { AuthProvider } from "react-admin";
import { createActor, editActor } from "./ActorAPI";
import { editArea } from "./AreaAPI";
import { editGroup, createGroup } from "./GroupAPI";
import { convertFileToBase64, uploadImages } from "./MediaAPI";
import { createProject, editProject } from "./ProjectAPI";

const publicDataProvider = http.APIRESTClient({
  url: process.env.REACT_APP_API_URL,
});

const dataProvider = http.APIRESTClient({
  url: process.env.REACT_APP_API_URL,
  getAuth: () => {
    const token = localStorage.getItem("auth");
    return token;
  },
});

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    const response = await publicDataProvider.create<{ token: string }>(
      "users/login",
      {
        data: { username, password },
      }
    );

    localStorage.setItem("auth", response.data.token);
    return response;
  },
  logout: async () => {
    localStorage.removeItem("auth");
    return await Promise.resolve(undefined);
  },
  checkAuth: async () =>
    localStorage.getItem("auth")
      ? await Promise.resolve()
      : await Promise.reject(new Error("Missing auth")),
  checkError: () => Promise.resolve(),
  getPermissions: () => Promise.resolve(),
};

export const apiProvider: http.APIRESTClient = {
  ...dataProvider,
  create: (resource, params) => {
    if (resource === "actors") {
      return createActor(dataProvider)(resource, params) as any;
    }

    if (resource === "groups") {
      return createGroup(dataProvider)(resource, params) as any;
    }

    if (resource === "projects") {
      return createProject(dataProvider)(resource, params);
    }

    return dataProvider.create(resource, params);
  },
  update: (resource, params) => {
    if (resource === "areas") {
      return editArea(dataProvider)(resource, params);
    }
    if (resource === "projects") {
      return editProject(dataProvider)(resource, params);
    }

    if (resource === "actors") {
      return editActor(dataProvider)(resource, params);
    }

    if (resource === "groups") {
      return editGroup(dataProvider)(resource, params);
    }

    if (resource === "groups-members") {
      return dataProvider.update(resource, {
        ...params,
        data: {
          ...params.data,
          group: params.data.group.id,
          actor: params.data.actor.id,
        },
      });
    }
    if (resource === "events") {
      const {
        newImages = [],
        images,
        newAreas = [],
        groupsMembers = [],
        areas,
        ...data
      } = params.data;

      return pipe(
        uploadImages(dataProvider)(
          resource,
          params.id.toString(),
          newImages
            .filter((i: any) => i !== undefined)
            .map((i: { location: { rawFile: File } }) => i.location.rawFile)
        ),
        TE.chain((result) => {
          const updateParams = {
            ...params,
            data: {
              ...data,
              areas: newAreas.map((a: any) => ({
                ...a,
                geometry: JSON.parse(a.geometry),
              })),
              images: images.concat(
                result.map((l) => ({
                  location: l,
                  description: "",
                }))
              ),
              groupsMembers,
            },
          };
          return TE.tryCatch(
            () => dataProvider.update<any>(resource, updateParams),
            E.toError
          );
        }),
        TE.fold(T.task.of, (result) => T.of(result as any))
      )();
    }

    if (resource === "groups") {
      // eslint-disable-next-line no-console
      if (typeof params.data.avatar === "object") {
        return convertFileToBase64(params.data.avatar)().then((result) => {
          const base64 = result as E.Right<string>;
          const finalData = {
            ...params.data,
            avatar: {
              path: params.data.avatar.rawFile.path,
              src: base64,
            },
          };
          return dataProvider.update(resource, {
            ...params,
            data: finalData,
          });
        });
      } else if (typeof params.data.avatar === "string") {
        const { avatar, ...data } = params.data;
        return dataProvider.update(resource, {
          ...params,
          data,
        });
      }
    }
    return dataProvider.update(resource, params);
  },
};
