import * as t from "io-ts"
import { DateFromISOString } from "io-ts-types/lib/DateFromISOString"
import { optionFromNullable } from "io-ts-types/lib/optionFromNullable"

export const TopicFrontmatter = t.type(
  {
    label: t.string,
    slug: t.string,
    date: DateFromISOString,
    cover: optionFromNullable(t.string),
    color: t.string,
  },
  "TopicFrontmatter"
)
export type TopicFrontmatter = t.TypeOf<typeof TopicFrontmatter>


export const TopicPageContentFileNode = t.type(
  {
    id: t.string,
    name: t.string,
    childMarkdownRemark: t.type(
      {
        frontmatter: TopicFrontmatter,
        htmlAst: t.object,
      },
      "TopicPageContentFileNodeMarkdownRemark"
    ),
  },
  "TopicPageContentFileNode"
)

export type TopicPageContentFileNode = t.TypeOf<typeof TopicPageContentFileNode>



export const TopicFileNode = t.interface(
  {
    name: t.string,
    relativeDirectory: t.string,
    childMarkdownRemark: t.interface({
      frontmatter: TopicFrontmatter,
    }),
  },
  "TopicFileNode"
)

export type TopicFileNode = t.TypeOf<typeof TopicFileNode>

export const TopicData = t.intersection(
  [
    TopicFrontmatter,
    t.interface({
      selected: t.boolean,
    }),
  ],
  "TopicData"
)

export type TopicData = t.TypeOf<typeof TopicData>

export const TopicPoint = t.interface(
  {
    x: t.number,
    y: t.number,
    data: TopicData,
  },
  "TopicPoint"
)

export type TopicPoint = t.TypeOf<typeof TopicPoint>