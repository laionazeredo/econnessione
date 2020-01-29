/**
 * @todo:
 * - show percentage of antiecologicalact/ecologicalact per topic
 */
import { Link } from "@vx/network/lib/types"
import * as A from "fp-ts/lib/Array"
import * as E from "fp-ts/lib/Either"
import * as Eq from "fp-ts/lib/Eq"
import * as Map from "fp-ts/lib/Map"
import * as O from "fp-ts/lib/Option"
import * as Ord from "fp-ts/lib/Ord"
import { pipe } from "fp-ts/lib/pipeable"
import "./networkTemplate.scss"
import { graphql } from "gatsby"
import * as t from "io-ts"
import { ThrowReporter } from "io-ts/lib/ThrowReporter"
import moment from "moment"
import React from "react"
import ActorList, { ActorListActor } from "../../components/ActorList/ActorList"
import { Columns } from "../../components/Common"
import Network, { NetworkProps } from "../../components/Common/Network/Network"
import EventList from "../../components/EventList/EventList"
import Layout from "../../components/Layout"
import SEO from "../../components/SEO"
import TimelineNavigator from "../../components/TimelineNavigator/TimelineNavigator"
import TopicList, { TopicListTopic } from "../../components/TopicList/TopicList"
import { PageContentNode } from "../../types/PageContent"
import { ActorFileNode } from "../../types/actor"
import { EventPoint, EventFileNode } from "../../types/event"
import { ImageFileNode } from "../../types/image"
import { TopicFileNode, TopicPoint } from "../../types/topic"
import { formatDate } from "../../utils/date"
import { ordEventFileNodeDate, ordEventPointDate } from "../../utils/event"
import { ImageNode } from "../../utils/image"

interface NetworksPageProps {
  navigate: (to: string) => void
  data: {
    pageContent: {
      childMarkdownRemark: PageContentNode
      relativeDirectory: string
    }
    topics: {
      nodes: TopicFileNode[]
    }
    actorsImages: {
      nodes: ImageNode[]
    }
    actors: {
      nodes: ActorFileNode[]
    }
    events: {
      nodes: EventFileNode[]
    }
    images: {
      nodes: ImageFileNode[]
    }
  }
}

interface NetworkLink extends Link<EventPoint> {
  fill: string
  stroke: string
}

type TopicsMap = Map<string, TopicPoint>

type ActorId = string
interface ActorsMapValue {
  actor: ActorFileNode
  color: string
  events: EventPoint[]
  links: NetworkLink[]
  antiEcologicAct: number
  ecologicAct: number
  totalActs: number
}

type ActorsMap = Map<ActorId, ActorsMapValue>

const colors = [
  "#abe188",
  "#1789fc",
  "#0256a1",
  "#8ccc00",
  "#fdb833",
  "#fd6d34",
  "#f0e345",
]

const peach = "#fd9b93"
const pink = "#fe6e9e"
const blue = "#03c0dc"
const green = "#26deb0"
const lightpurple = "#374469"
const actorColors = [blue, green, peach, lightpurple, pink, "#f0e345"]

// calculate x based on date
// (date - minDate) : (maxDate - minDate) = x : width
// x = (date - minDate) * width / (maxDate - minDate)
const getX = (
  date: Date,
  minDate: Date,
  maxDate: Date,
  width: number
): number => {
  return (
    ((date.getTime() - minDate.getTime()) * width) /
    (maxDate.getTime() - minDate.getTime())
  )
}

const getY = (topics: string[], margin: number, height: number) => (
  key: string
) => {
  const pos = topics.findIndex(t => Eq.eqString.equals(t, key))
  if (pos > -1) {
    return margin + pos * ((height - margin * 2) / topics.length)
  }
  return 0
}

function addOneIfEqualTo(o: O.Option<string>, match: string): 0 | 1 {
  return pipe(
    o,
    O.exists(type => Eq.eqString.equals(type, match))
  )
    ? 1
    : 0
}

function getWeek(date: Date): number {
  var onejan = new Date(date.getFullYear(), 0, 1)
  var millisecsInDay = 86400000
  return Math.ceil(
    ((date.getTime() - onejan.getTime()) / millisecsInDay +
      onejan.getDay() +
      1) /
      7
  )
}

function getMinDateByScale(
  scale: NetworkProps["scale"],
  event: EventPoint
): Date {
  if (scale === "year") {
    return new Date(event.data.frontmatter.date.getFullYear(), 0, 1)
  } else if (scale === "month") {
    return new Date(
      event.data.frontmatter.date.getFullYear(),
      event.data.frontmatter.date.getMonth(),
      1
    )
  } else if (scale === "week") {
    return moment(event.data.frontmatter.date)
      .subtract(1, "w")
      .toDate()
  }
  return moment(event.data.frontmatter.date)
    .hour(0)
    .min(0)
    .toDate()
}

function getMaxDateByScale(
  scale: NetworkProps["scale"],
  event: EventPoint
): Date {
  if (scale === "year") {
    return new Date(event.data.frontmatter.date.getFullYear(), 11, 31)
  } else if (scale === "month") {
    return moment({
      year: event.data.frontmatter.date.getFullYear(),
      month: event.data.frontmatter.date.getMonth(),
    })
      .add(1, "month")
      .subtract(1, "day")
      .toDate()
  } else if (scale === "week") {
    return moment(event.data.frontmatter.date)
      .add(1, "week")
      .toDate()
  }
  return moment(event.data.frontmatter.date)
    .hour(24)
    .min(0)
    .toDate()
}

const width = 1000
const height = 400
const marginVertical = 30
const marginHorizontal = 30

interface NetworkTemplateState {
  scale: NetworkProps["scale"]
  scalePoint: O.Option<EventPoint>
  selectedActorIds: string[]
  selectedTopicIds: string[]
}

export default class NetworkTemplate extends React.Component<
  NetworksPageProps,
  NetworkTemplateState
> {
  state: NetworkTemplateState = {
    scale: "all",
    scalePoint: O.none,
    selectedActorIds: [],
    selectedTopicIds: [],
  }

  onActorClick = (actor: ActorListActor): void => {
    this.setState({
      selectedActorIds: A.elem(Eq.eqString)(
        actor.id,
        this.state.selectedActorIds
      )
        ? A.array.filter(
            this.state.selectedActorIds,
            a => !Eq.eqString.equals(a, actor.id)
          )
        : this.state.selectedActorIds.concat(actor.id),
    })
  }

  onTopicClick = (topic: TopicListTopic): void => {
    this.setState({
      selectedTopicIds: A.elem(Eq.eqString)(
        topic.id,
        this.state.selectedTopicIds
      )
        ? A.array.filter(
            this.state.selectedTopicIds,
            a => !Eq.eqString.equals(a, topic.id)
          )
        : this.state.selectedTopicIds.concat(topic.id),
    })
  }

  onNetworkDoubleClick = (
    scalePoint: EventPoint,
    scale: NetworkProps["scale"]
  ): void => {
    this.setState({
      scalePoint: O.some(scalePoint),
      scale:
        scale === "all"
          ? "year"
          : scale === "year"
          ? "month"
          : scale === "month"
          ? "week"
          : scale === "week"
          ? "day"
          : "all",
    })
  }

  render(): React.ReactElement | null {
    const {
      props: { data, navigate },
      state: { scale, scalePoint, selectedActorIds, selectedTopicIds },
    } = this

    const networkName = A.takeRight(1)(
      data.pageContent.relativeDirectory.split("/")
    )[0]

    const yGetter = getY(
      data.topics.nodes.map(n => n.childMarkdownRemark.frontmatter.slug),
      marginVertical,
      height
    )

    // create a topics map
    const topicsMap = data.topics.nodes.reduce<TopicsMap>((acc, t, i) => {
      return Map.insertAt(Eq.eqString)(t.childMarkdownRemark.frontmatter.slug, {
        id: t.id,
        label: t.childMarkdownRemark.frontmatter.title,
        slug: t.childMarkdownRemark.frontmatter.slug,
        color: colors[i],
        x: 0,
        y: yGetter(t.childMarkdownRemark.frontmatter.slug),
      })(acc)
    }, Map.empty)

    const actorsMap = A.zip(data.actors.nodes, actorColors).reduce<ActorsMap>(
      (acc, [actor, color]) => {
        const cover = data.actorsImages.nodes.find(
          imageNode =>
            actor.childMarkdownRemark.frontmatter.avatar ===
            `${imageNode.name}${imageNode.ext}`
        )

        const value: ActorsMapValue = {
          actor: {
            ...actor,
            childMarkdownRemark: {
              ...actor.childMarkdownRemark,
              frontmatter: {
                ...actor.childMarkdownRemark.frontmatter,
                cover:
                  cover !== undefined ? cover.childImageSharp.fluid.src : null,
              },
            },
          },
          color,
          events: [],
          links: [],
          antiEcologicAct: 0,
          ecologicAct: 0,
          totalActs: 0,
        }

        return Map.insertAt(Eq.eqString)(actor.id, value)(acc)
      },
      Map.empty
    )

    const actorsList = Map.toArray(Ord.ordString)(actorsMap).map(
      ([_, actor]) => actor
    )

    return pipe(
      t.array(EventFileNode).decode(data.events.nodes),
      E.map(events =>
        scale === "all"
          ? events
          : pipe(
              scalePoint,
              O.map(p => {
                const selectedFullYear = p.data.frontmatter.date.getFullYear()
                const selectedMonth = p.data.frontmatter.date.getMonth()
                const selectedWeek = getWeek(p.data.frontmatter.date)
                const selectedDate = p.data.frontmatter.date.getDate()
                return events.filter(n => {
                  const nodeFullYear = n.childMarkdownRemark.frontmatter.date.getFullYear()
                  const nodeMonth = n.childMarkdownRemark.frontmatter.date.getMonth()
                  const nodeWeek = getWeek(
                    n.childMarkdownRemark.frontmatter.date
                  )
                  const nodeDate = n.childMarkdownRemark.frontmatter.date.getDate()

                  if (scale === "year") {
                    return Eq.eqNumber.equals(nodeFullYear, selectedFullYear)
                  }
                  if (scale === "month") {
                    return (
                      Eq.eqNumber.equals(nodeFullYear, selectedFullYear) &&
                      Eq.eqNumber.equals(nodeMonth, selectedMonth)
                    )
                  }

                  if (scale === "week") {
                    return (
                      Eq.eqNumber.equals(nodeFullYear, selectedFullYear) &&
                      Eq.eqNumber.equals(nodeMonth, selectedMonth) &&
                      Eq.eqNumber.equals(nodeWeek, selectedWeek)
                    )
                  }

                  if (scale === "day") {
                    return (
                      Eq.eqNumber.equals(nodeFullYear, selectedFullYear) &&
                      Eq.eqNumber.equals(nodeMonth, selectedMonth) &&
                      Eq.eqNumber.equals(nodeWeek, selectedWeek) &&
                      Eq.eqNumber.equals(nodeDate, selectedDate)
                    )
                  }
                  return true
                })
              }),
              O.getOrElse((): EventFileNode[] => [])
            )
      ),
      E.map(events => {
        const eventsSortedByDate = pipe(
          events,
          A.sortBy([ordEventFileNodeDate])
        )

        const minDate =
          scale === "all"
            ? pipe(
                A.head(eventsSortedByDate),
                O.map(e => e.childMarkdownRemark.frontmatter.date),
                O.getOrElse(() => new Date("2018-01-01"))
              )
            : pipe(
                scalePoint,
                O.map(p => getMinDateByScale(scale, p)),
                O.getOrElse(() => new Date("2018-01-01"))
              )

        const maxDate =
          scale === "all"
            ? pipe(
                A.last(eventsSortedByDate),
                O.map(e => e.childMarkdownRemark.frontmatter.date),
                O.getOrElse(() => new Date())
              )
            : pipe(
                scalePoint,
                O.map(p => getMaxDateByScale(scale, p)),
                O.getOrElse(() => new Date())
              )

        interface Result {
          eventNodes: Map<string, EventPoint[]>
          eventLinks: Map<string, NetworkLink[]>
          selectedNodes: Map<string, EventPoint[]>
          actorsWithEventsAndLinksMap: ActorsMap
        }

        const result: Result = {
          eventNodes: Map.empty,
          eventLinks: Map.empty,
          selectedNodes: Map.empty,
          actorsWithEventsAndLinksMap: Map.empty,
        }

        const {
          eventNodes,
          eventLinks,
          selectedNodes,
          actorsWithEventsAndLinksMap,
        } = eventsSortedByDate.reduce<Result>((acc, e) => {
          // get topic from relative directory

          const cover = pipe(
            O.fromNullable(e.childMarkdownRemark.frontmatter.cover),
            O.chain(c =>
              O.fromNullable(
                data.images.nodes.find(e =>
                  Eq.eqString.equals(`${e.name}${e.ext}`, c)
                )
              )
            ),
            O.map(e => e.childImageSharp.fluid.src)
          )

          const topic = pipe(
            A.head(A.takeRight(1)(e.relativeDirectory.split("/"))),
            O.chain(t => Map.lookup(Eq.eqString)(t, topicsMap)),
            O.getOrElse(() => ({
              id: "fake-id",
              x: -100,
              y: -100,
              label: "fake",
              slug: "fake",
              color: colors[0],
            }))
          )

          const isTopicSelected = A.elem(Eq.eqString)(
            topic.id,
            selectedTopicIds
          )

          const eventFrontmatterType = O.fromNullable(
            e.childMarkdownRemark.frontmatter.type
          )
          const eventActors = pipe(
            O.fromNullable(e.childMarkdownRemark.frontmatter.actors),
            O.map(actors =>
              actors.reduce<ActorFileNode[]>((acc, a) => {
                const actor = actorsList.find(
                  _ => _.actor.childMarkdownRemark.frontmatter.username === a
                )
                return actor !== undefined ? acc.concat(actor.actor) : acc
              }, [])
            )
          )

          const eventFrontmatterLinks = O.fromNullable(
            e.childMarkdownRemark.frontmatter.links
          )

          const eventPoint: EventPoint = {
            x:
              marginHorizontal +
              getX(
                e.childMarkdownRemark.frontmatter.date,
                minDate,
                maxDate,
                width - marginHorizontal * 2
              ),
            y: yGetter(topic.slug),
            data: {
              ...e.childMarkdownRemark,
              topicLabel: topic.label,
              topicFill: topic.color,
              topicSlug: topic.slug,
              fill: topic.color,
              frontmatter: {
                ...e.childMarkdownRemark.frontmatter,
                type: eventFrontmatterType,
                links: eventFrontmatterLinks,
                actors: eventActors,
                cover,
              },
            },
          }

          const eventNodes = pipe(
            Map.lookup(Eq.eqString)(topic.id, acc.eventNodes),
            O.fold(
              () => [eventPoint],
              events => events.concat(eventPoint)
            )
          )

          const selectedNodes = isTopicSelected
            ? pipe(
                Map.lookup(Eq.eqString)(topic.id, acc.selectedNodes),
                O.fold(
                  () => [eventPoint],
                  events => events.concat(eventPoint)
                )
              )
            : []

          const eventLinks = isTopicSelected
            ? pipe(
                Map.lookup(Eq.eqString)(topic.id, acc.eventLinks),
                O.fold(
                  () => [
                    {
                      source: eventPoint,
                      target: eventPoint,
                      fill: topic.color,
                      stroke: topic.color,
                    },
                  ],
                  links => {
                    return links.concat({
                      source: pipe(
                        A.last(links),
                        O.map(l => l.target),
                        O.getOrElse(() => eventPoint)
                      ),
                      target: eventPoint,
                      stroke: topic.color,
                      fill: topic.color,
                    })
                  }
                )
              )
            : []

          const actorsWithEventsAndLinksMap = pipe(
            eventActors,
            O.map(actors => {
              return Map.toArray(Ord.ordString)(actorsMap)
                .filter(([_, a]) =>
                  actors.find(_ => _.id === a.actor.id)
                )
                .reduce<ActorsMap>((prev, [_, a]) => {
                  const actorData = pipe(
                    Map.lookup(Eq.eqString)(a.actor.id, prev),
                    O.fold(
                      (): ActorsMapValue => {
                        const events = A.elem(Eq.eqString)(
                          a.actor.id,
                          selectedActorIds
                        )
                          ? [eventPoint]
                          : []

                        return {
                          ...a,
                          ecologicAct: addOneIfEqualTo(
                            eventFrontmatterType,
                            "EcologicAct"
                          ),
                          antiEcologicAct: addOneIfEqualTo(
                            eventFrontmatterType,
                            "AntiEcologicAct"
                          ),
                          events: events,
                          links: [],
                          totalActs: 1,
                        }
                      },
                      (item): ActorsMapValue => {
                        const link = {
                          source: pipe(
                            A.last(item.events),
                            O.getOrElse(() => eventPoint)
                          ),
                          target: eventPoint,
                          fill: a.color,
                          stroke: a.color,
                        }

                        const events = A.elem(Eq.eqString)(
                          a.actor.id,
                          selectedActorIds
                        )
                          ? item.events.concat(eventPoint)
                          : []

                        return {
                          ...item,
                          events: events,
                          links: item.links.concat(link),
                          ecologicAct:
                            item.ecologicAct +
                            addOneIfEqualTo(
                              eventFrontmatterType,
                              "EcologicAct"
                            ),
                          antiEcologicAct:
                            item.antiEcologicAct +
                            addOneIfEqualTo(
                              eventFrontmatterType,
                              "AntiEcologicAct"
                            ),
                          totalActs: item.totalActs + 1,
                        }
                      }
                    )
                  )
                  return Map.insertAt(Eq.eqString)(a.actor.id, actorData)(prev)
                }, acc.actorsWithEventsAndLinksMap)
            }),
            O.getOrElse((): ActorsMap => acc.actorsWithEventsAndLinksMap)
          )

          return {
            eventNodes: Map.insertAt(Eq.eqString)(topic.id, eventNodes)(
              acc.eventNodes
            ),
            eventLinks: Map.insertAt(Eq.eqString)(topic.id, eventLinks)(
              acc.eventLinks
            ),
            selectedNodes: Map.insertAt(Eq.eqString)(topic.id, selectedNodes)(
              acc.selectedNodes
            ),
            actorsWithEventsAndLinksMap: actorsWithEventsAndLinksMap,
          }
        }, result)

        const topics = Map.toArray(Ord.ordString)(topicsMap).map(
          ([_, topic]) => ({
            ...topic,
            selected: A.elem(Eq.eqString)(topic.id, selectedTopicIds),
          })
        )

        const nodes = Map.toArray(Ord.ordString)(eventNodes).reduce<
          EventPoint[]
        >((acc, [_, nodes]) => acc.concat(...nodes), [])

        const links = Map.toArray(Ord.ordString)(eventLinks).reduce<
          NetworkLink[]
        >((acc, [_, links]) => acc.concat(...links), [])

        interface ActorsResults {
          actors: Array<
            Omit<ActorsMapValue, "actor" | "events" | "links"> & {
              actor: ActorListActor
            }
          >
          events: EventPoint[]
          links: NetworkLink[]
        }
        const actorResults = Map.toArray(Ord.ordString)(
          actorsWithEventsAndLinksMap
        ).reduce<ActorsResults>(
          (acc, [_, value]) => {
            return {
              actors: acc.actors.concat({
                actor: {
                  ...value.actor,
                  selected: A.elem(Eq.eqString)(
                    value.actor.id,
                    selectedActorIds
                  ),
                  color: value.color,
                },
                antiEcologicAct: value.antiEcologicAct,
                ecologicAct: value.ecologicAct,
                totalActs: value.totalActs,
                color: value.color,
              }),
              events: acc.events.concat(...value.events),
              links: acc.links.concat(...value.links),
            }
          },
          { actors: [], events: [], links: [] }
        )

        const selectedNodesArray: EventPoint[] = Map.toArray(Ord.ordString)(
          selectedNodes
        ).reduce<EventPoint[]>((acc, [_, nodes]) => acc.concat(...nodes), [])

        const filteredActorEvents = actorResults.events.filter(
          e =>
            selectedNodesArray.find(s => s.data.id === e.data.id) === undefined
        )

        const selectedNodesSorted = A.sortBy([
          Ord.getDualOrd(ordEventPointDate),
        ])(selectedNodesArray.concat(...filteredActorEvents))

        const selectedEventsCounter = selectedNodesSorted.reduce(
          (acc, n) =>
            acc +
            O.fold(
              () => 0,
              t => (t === "AntiEcologicalAct" ? -1 : 1)
            )(n.data.frontmatter.type),
          0
        )

        return {
          minDate,
          maxDate,
          scale,
          pageContent: data.pageContent,
          topics,
          topicsColors: A.zip(
            data.topics.nodes.map(l => l.id),
            colors
          ),
          actors: actorResults.actors,
          graph: {
            nodes,
            links: links.concat(...actorResults.links),
          },
          selectedNodes: selectedNodesSorted,
          selectedEventsCounter: {
            counter: selectedEventsCounter,
            total: selectedNodesSorted.length,
          },
        }
      }),
      E.fold(
        errs => {
          // eslint-disable-next-line no-console
          console.log(ThrowReporter.report(E.left(errs)))
          return null
        },
        ({
          pageContent,
          minDate,
          maxDate,
          scale,
          graph,
          actors,
          topics,
          selectedNodes,
          selectedEventsCounter,
        }) => {
          return (
            <Layout>
              <SEO title={pageContent.childMarkdownRemark.frontmatter.title} />
              <Columns>
                <Columns.Column size={12} style={{ textAlign: "center" }}>
                  <div className="title">
                    {pageContent.childMarkdownRemark.frontmatter.title}
                  </div>
                  <div
                    className="content"
                    dangerouslySetInnerHTML={{
                      __html: pageContent.childMarkdownRemark.html,
                    }}
                  />
                </Columns.Column>

                <Columns.Column size={2}>
                  <TopicList topics={topics} onTopicClick={this.onTopicClick} />
                  <ActorList
                    actors={actors.map(a => a.actor)}
                    onActorClick={this.onActorClick}
                  />
                  <div>
                    {selectedEventsCounter.counter}/
                    {selectedEventsCounter.total}
                  </div>
                </Columns.Column>
                <Columns.Column size={10}>
                  <div style={{ width, height }}>
                    <Network
                      width={width}
                      height={height}
                      scale={scale}
                      minDate={minDate}
                      maxDate={maxDate}
                      graph={graph as any}
                      onEventLabelClick={event => {
                        navigate(`/timelines/${networkName}/${event}`)
                      }}
                      onNodeClick={event => {
                        navigate(
                          `/timelines/${networkName}/${event.data.topicSlug}#${event.data.id}`
                        )
                      }}
                      onDoubleClick={this.onNetworkDoubleClick}
                    />
                  </div>
                  <div>
                    Scale: {scale}, Date Range: {formatDate(minDate)} -{" "}
                    {formatDate(maxDate)}
                  </div>
                </Columns.Column>
                <Columns.Column size={12}>
                  <Columns>
                    <Columns.Column size={3}>
                      <TimelineNavigator
                        events={selectedNodes.map(n => ({
                          ...n.data,
                          frontmatter: {
                            ...n.data.frontmatter,
                            actors: pipe(
                              n.data.frontmatter.actors,
                              O.fold(
                                () => [],
                                a => a.map(_ => _.id)
                              )
                            ),
                          },
                        }))}
                        onEventClick={e =>
                          navigate(`${window.location.href}?#${e.id}`)
                        }
                      />
                    </Columns.Column>
                    <Columns.Column size={9}>
                      <div className="content">
                        <EventList events={selectedNodes.map(n => n.data)} />
                      </div>
                    </Columns.Column>
                  </Columns>
                </Columns.Column>
              </Columns>
            </Layout>
          )
        }
      )
    )
  }
}

export const pageQuery = graphql`
  query(
    $relativeDirectory: String!
    $eventsRelativeDirectory: String!
    $imagesRelativeDirectory: String!
  ) {
    pageContent: file(
      relativeDirectory: { eq: $relativeDirectory }
      name: { eq: "index" }
    ) {
      relativeDirectory
      childMarkdownRemark {
        id
        frontmatter {
          title
          path
          date
          icon
          type
          cover
        }
        html
      }
    }
    topics: allFile(
      filter: {
        relativeDirectory: { glob: $eventsRelativeDirectory }
        name: { eq: "index" }
      }
    ) {
      nodes {
        id
        relativeDirectory
        childMarkdownRemark {
          frontmatter {
            title
            slug
          }
        }
      }
    }
    actors: allFile(
      filter: {
        relativeDirectory: { glob: "events/actors/*" }
        name: { eq: "index" }
      }
    ) {
      nodes {
        id
        relativeDirectory
        childMarkdownRemark {
          frontmatter {
            title
            cover
            avatar
            username
          }
          html
        }
      }
    }
    actorsImages: allFile(
      filter: { relativeDirectory: { glob: "events/actors/**/images" } }
    ) {
      nodes {
        relativeDirectory
        name
        ext
        childImageSharp {
          fluid {
            src
          }
        }
      }
    }
    events: allFile(
      filter: {
        relativeDirectory: { glob: $eventsRelativeDirectory }
        name: { ne: "index" }
      }
    ) {
      nodes {
        relativeDirectory
        childMarkdownRemark {
          id
          frontmatter {
            title
            path
            date
            icon
            type
            cover
            actors
          }
          html
        }
      }
    }
    images: allFile(
      filter: { relativeDirectory: { glob: $imagesRelativeDirectory } }
    ) {
      nodes {
        childImageSharp {
          fluid {
            src
          }
          fixed {
            src
          }
        }
        absolutePath
        relativeDirectory
        relativePath
      }
    }
  }
`
