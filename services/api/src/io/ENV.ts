import * as t from "io-ts";
import { NumberFromString } from "io-ts-types/lib/NumberFromString";

const NODE_ENV = t.union([t.literal('test'), t.literal("development"), t.literal("production")], 'NODE_ENV');

const ENV = t.intersection(
  [
    t.strict({
      DEBUG: t.string,
      NODE_ENV,
      API_PORT: NumberFromString,
      API_HOST: t.string,
      DEFAULT_PAGE_SIZE: NumberFromString,
      JWT_SECRET: t.string,
    }),
    t.strict(
      {
        // SPACES
        SPACE_BUCKET: t.string,
        SPACE_REGION: t.string,
        SPACE_ACCESS_KEY_ID: t.string,
        SPACE_ACCESS_KEY_SECRET: t.string,
      },
      "SPACE_ENV"
    ),
    t.intersection(
      [
        t.strict({
          DB_USERNAME: t.string,
          DB_PASSWORD: t.string,
          DB_HOST: t.string,
          DB_PORT: NumberFromString,
          DB_DATABASE: t.string,
        }),
        t.union([
          t.strict({
            DB_SSL_MODE: t.literal("require"),
            DB_SSL_CERT_PATH: t.string,
          }),
          t.strict({
            DB_SSL_MODE: t.literal("off"),
          }),
        ]),
      ],
      "DB_ENV"
    ),
  ],
  "ENV"
);

type ENV = t.TypeOf<typeof ENV>;

export { ENV };
