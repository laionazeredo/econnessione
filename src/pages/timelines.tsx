import DatePicker from "@components/Common/DatePicker"
import { ContentWithSideNavigation } from "@components/ContentWithSideNavigation"
// import EventsMap from "@components/EventsMap"
import { Layout } from "@components/Layout"
import { MainContent } from "@components/MainContent"
import { PageContent } from "@components/PageContent"
import SEO from "@components/SEO"
import SearchableInput from "@components/SearchableInput"
import { ActorListItem } from "@components/lists/ActorList"
import EventList from "@components/lists/EventList/EventList"
import { GroupListItem } from "@components/lists/GroupList"
import { TopicListItem } from "@components/lists/TopicList"
import { eventsDataToNavigatorItems, ordEventDate } from "@helpers/event"
import { ActorFrontmatter } from "@models/actor"
import { EventMD } from "@models/events/EventMetadata"
import { GroupFrontmatter } from "@models/group"
import { PageContentFileNode } from "@models/page"
import { TopicFrontmatter } from "@models/topic"
import theme from "@theme/CustomeTheme"
import { eqByUUID } from "@utils/frontmatter"
import { parseSearch, Routes, updateSearch } from "@utils/routes"
import { throwValidationErrors } from "@utils/throwValidationErrors"
import { FlexGrid, FlexGridItem } from "baseui/flex-grid"
import { LabelMedium } from "baseui/typography"
import { subYears } from "date-fns"
import { sequenceS } from "fp-ts/lib/Apply"
import * as A from "fp-ts/lib/Array"
import * as E from "fp-ts/lib/Either"
import * as O from "fp-ts/lib/Option"
import * as Ord from "fp-ts/lib/Ord"
import { pipe } from "fp-ts/lib/pipeable"
import { graphql, PageProps } from "gatsby"
import * as t from "io-ts"
import React from "react"
import Helmet from "react-helmet"

interface EventsPageProps extends PageProps {
  data: {
    pageContent: unknown
    events: { nodes: unknown }
    topics: { nodes: unknown }
    actors: { nodes: unknown }
    groups: { nodes: unknown }
  }
}

const EventsPage: React.FC<EventsPageProps> = ({
  data,
  navigate,
  ...props
}) => {
  return pipe(
    sequenceS(E.either)({
      pageContent: PageContentFileNode.decode(data.pageContent),
      topics: t.array(TopicFrontmatter).decode(data.topics.nodes),
      actors: t.array(ActorFrontmatter).decode(data.actors.nodes),
      groups: t.array(GroupFrontmatter).decode(data.groups.nodes),
      events: t.array(EventMD).decode(data.events.nodes),
    }),
    E.fold(
      throwValidationErrors,
      ({ pageContent, events, actors, topics, groups }) => {
        const {
          actors: actorUUIDS = [],
          topics: topicUUIDS = [],
          groups: groupUUIDs = [],
        } = pipe(
          parseSearch(props.location, "timelines"),
          E.getOrElse((): Routes["timelines"] => ({
            actors: [],
            topics: [],
            groups: [],
          }))
        )

        const [selectedGroups, setSelectedGroups] = React.useState(
          groups.filter((g) => groupUUIDs.includes(g.uuid))
        )

        const [selectedActors, setSelectedActors] = React.useState(
          actors.filter((a) => actorUUIDS.includes(a.uuid))
        )
        const [selectedTopics, setSelectedTopicIds] = React.useState(
          topics.filter((t) => topicUUIDS.includes(t.uuid))
        )

        const selectedActorIds = selectedActors.map((a) => a.uuid)
        const selectedGroupIds = selectedGroups.map((g) => g.uuid)
        const selectedTopicIds = selectedTopics.map((t) => t.uuid)

        const [dateRange, setDateRange] = React.useState<Date[]>([
          subYears(new Date(), 10),
          new Date(),
        ])

        const onActorClick = (actor: ActorFrontmatter): void => {
          const newSelectedActorIds = A.elem(eqByUUID)(actor, selectedActors)
            ? A.array.filter(selectedActors, (a) => !eqByUUID.equals(a, actor))
            : selectedActors.concat(actor)
          setSelectedActors(newSelectedActorIds)

          pipe(
            updateSearch(
              props.location,
              "timelines"
            )({ actors: newSelectedActorIds.map((s) => s.uuid) }),
            E.map(async (url) => await navigate(url))
          )
        }

        const onGroupClick = (g: GroupFrontmatter): void => {
          const newSelectedGroupIds = A.elem(eqByUUID)(g, selectedGroups)
            ? A.array.filter(selectedGroups, (a) => !eqByUUID.equals(a, g))
            : selectedGroups.concat(g)
          setSelectedGroups(newSelectedGroupIds)

          pipe(
            updateSearch(
              props.location,
              "timelines"
            )({ groups: newSelectedGroupIds.map((s) => s.uuid) }),
            E.map(async (url) => await navigate(url))
          )
        }

        const onTopicClick = (topic: TopicFrontmatter): void => {
          const newSelectedTopics = A.elem(eqByUUID)(topic, selectedTopics)
            ? A.array.filter(selectedTopics, (a) => !eqByUUID.equals(a, topic))
            : selectedTopics.concat(topic)

          setSelectedTopicIds(newSelectedTopics)

          pipe(
            updateSearch(
              props.location,
              "timelines"
            )({ topics: newSelectedTopics.map((s) => s.uuid) }),
            E.map(async (url) => await navigate(url))
          )
        }

        const onDatePickerChange = (value: { date: Date | Date[] }): void => {
          if (Array.isArray(value.date)) {
            setDateRange(value.date)
          }
        }

        const minDate = dateRange[0]
        const maxDate = pipe(
          O.fromNullable(dateRange[1]),
          O.getOrElse(() => new Date())
        )

        const filteredEvents = A.sort(Ord.getDualOrd(ordEventDate))(
          events
        ).filter((e) => {
          const isBetweenDateRange = Ord.between(Ord.ordDate)(minDate, maxDate)(
            e.frontmatter.date
          )
          const hasActor = pipe(
            e.frontmatter.actors,
            O.map((actors) =>
              actors.some((i) =>
                selectedActors.some((a) => eqByUUID.equals(a, i))
              )
            ),
            O.getOrElse(() => false)
          )

          const hasGroup = pipe(
            e.frontmatter.groups,
            O.map((groups) =>
              groups.some((i) =>
                selectedGroups.some((a) => eqByUUID.equals(a, i))
              )
            ),
            O.getOrElse(() => false)
          )

          const hasTopic = pipe(
            O.some(e.frontmatter.topics),
            O.map((topics) =>
              topics.some((i) =>
                selectedTopics.some((a) => eqByUUID.equals(a, i))
              )
            ),
            O.getOrElse(() => false)
          )

          return isBetweenDateRange && (hasActor || hasGroup || hasTopic)
        })

        return (
          <Layout>
            <Helmet>
              <SEO title={pageContent.childMdx.frontmatter.title} />
            </Helmet>
            <FlexGrid
              alignItems="center"
              alignContent="center"
              justifyItems="center"
              flexGridColumnCount={1}
            >
              <FlexGridItem width="100%">
                <MainContent>
                  <PageContent {...pageContent.childMdx} />
                </MainContent>

                <FlexGrid
                  flexGridColumnCount={4}
                  alignItems="start"
                  height="300px"
                >
                  <FlexGridItem height="100%" display="flex">
                    <DatePicker
                      value={dateRange}
                      range={true}
                      quickSelect={true}
                      onChange={onDatePickerChange}
                    />
                  </FlexGridItem>
                  <FlexGridItem height="100%" display="flex">
                    <SearchableInput
                      placeholder="Topics..."
                      items={topics.filter(
                        (t) => !selectedTopicIds.includes(t.uuid)
                      )}
                      selectedItems={selectedTopics}
                      getValue={(item) => item.label}
                      itemRenderer={(item, itemProps, index) => (
                        <TopicListItem
                          $theme={theme}
                          key={item.uuid}
                          index={index}
                          item={{
                            ...item,
                            selected: selectedTopics.some((t) =>
                              eqByUUID.equals(t, item)
                            ),
                          }}
                          onClick={(item) => itemProps.onClick(item)}
                        />
                      )}
                      onSelectItem={(item, items) => {
                        onTopicClick(item)
                      }}
                      onUnselectItem={(item) => onTopicClick(item)}
                    />
                  </FlexGridItem>
                  <FlexGridItem
                    height="100%"
                    display="flex"
                    flexGridColumnCount={1}
                  >
                    <SearchableInput
                      placeholder="Gruppi..."
                      items={groups.filter(
                        (g) => !selectedGroupIds.includes(g.uuid)
                      )}
                      selectedItems={selectedGroups}
                      itemRenderer={(item, itemProps, index) => {
                        return (
                          <GroupListItem
                            key={item.uuid}
                            index={index}
                            item={{
                              ...item,
                              selected: selectedGroups.some((g) =>
                                eqByUUID.equals(g, item)
                              ),
                            }}
                            onClick={(item) => itemProps.onClick(item)}
                            avatarScale="scale1000"
                          />
                        )
                      }}
                      onSelectItem={(item) => {
                        onGroupClick(item)
                      }}
                      onUnselectItem={(item) => {
                        onGroupClick(item)
                      }}
                      getValue={(item) => item.name}
                    />
                  </FlexGridItem>
                  <FlexGridItem height="100%" display="flex">
                    <SearchableInput
                      placeholder="Attori..."
                      items={actors.filter(
                        (a) => !selectedActorIds.includes(a.uuid)
                      )}
                      selectedItems={selectedActors}
                      itemRenderer={(item, itemProps, index) => {
                        return (
                          <ActorListItem
                            key={item.uuid}
                            index={index}
                            item={{
                              ...item,
                              selected: selectedActors.some((a) =>
                                eqByUUID.equals(a, item)
                              ),
                            }}
                            onClick={(item) => itemProps.onClick(item)}
                            avatarScale="scale1000"
                          />
                        )
                      }}
                      onSelectItem={(item) => onActorClick(item)}
                      onUnselectItem={(item) => onActorClick(item)}
                      getValue={(item) => item.username}
                    />
                  </FlexGridItem>
                </FlexGrid>
                <LabelMedium>Nº Eventi: {filteredEvents.length}</LabelMedium>
              </FlexGridItem>
              <FlexGridItem>
                <ContentWithSideNavigation
                  items={eventsDataToNavigatorItems(filteredEvents)}
                >
                  <EventList events={filteredEvents} />
                </ContentWithSideNavigation>
              </FlexGridItem>
            </FlexGrid>
          </Layout>
        )
      }
    )
  )
}

export const pageQuery = graphql`
  query EventsQuery {
    pageContent: file(
      childMdx: { fields: { collection: { eq: "pages" } } }
      name: { eq: "timelines" }
    ) {
      ...PageFileNode
    }

    topics: allTopicFrontmatter {
      nodes {
        ...Topic
      }
    }

    actors: allActorFrontmatter {
      nodes {
        ...Actor
      }
    }

    groups: allGroupFrontmatter {
      nodes {
        ...Group
      }
    }

    events: allMdx(filter: { fields: { collection: { eq: "events" } } }) {
      nodes {
        ...EventMDRemark
      }
    }
  }
`
export default EventsPage
