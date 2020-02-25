import renderMarkdownAST from "@utils/renderMarkdownAST"
import * as O from "fp-ts/lib/Option"
import * as t from "io-ts"
import { DateFromISOString } from "io-ts-types/lib/DateFromISOString"
import { optionFromNullable } from "io-ts-types/lib/optionFromNullable"
import * as React from "react"
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component"
import "react-vertical-timeline-component/style.min.css"


export const TimelineEventIcon = t.keyof(
  {
    "pencil-alt": null,
  },
  "TimelineEventIcon"
)

export type TimelineEventIcon = t.TypeOf<typeof TimelineEventIcon>

const TimelineEventType = t.keyof(
  {
    EcologicAct: null,
    AntiEcologicAct: null,
  },
  "TimelineEventType"
)

export type TimelineEventType = t.TypeOf<typeof TimelineEventType>

export const TimelineEventFrontmatter = t.interface(
  {
    icon: TimelineEventIcon,
    title: t.string,
    date: DateFromISOString,
    type: optionFromNullable(TimelineEventType),
    cover: optionFromNullable(t.string),
  },

  "TimelinveEventFrontmatter"
)

export type TimelineEventFrontmatter = t.TypeOf<typeof TimelineEventFrontmatter>

export const TimelineEvent = t.exact(
  t.intersection(
    [
      TimelineEventFrontmatter,
      t.interface({
        id: t.string,
        htmlAst: t.object,
        image: optionFromNullable(t.interface({ src: t.string })),
      }),
    ],
    "TimelineEvent"
  )
)
export type TimelineEvent = t.TypeOf<typeof TimelineEvent>

interface TimelineProps {
  events: TimelineEvent[]
}

const getColorByType = (t: TimelineEventType): string => {
  switch (t) {
    case "EcologicAct":
      return "green"
    case "AntiEcologicAct":
    default:
      return "red"
  }
}

interface TimelineItemProps {
  event: TimelineEvent
}
const TimelineItem: React.FC<TimelineItemProps> = ({ event }) => {
  const color = O.toUndefined(O.option.map(event.type, getColorByType))

  return (
    <VerticalTimelineElement
      key={event.id}
      className="vertical-timeline-element--work"
      contentStyle={{
        borderWidth: 1,
        borderColor: color,
        borderStyle: "solid",
      }}
      contentArrowStyle={{
        borderRight: "7px solid",
        borderRightColor: color,
      }}
      date={event.date.toISOString()}
      iconStyle={{}}
      icon={
          <i className={`fas fa-${event.icon}`} />
      }
    >
      <div>{event.title}</div>
      {O.toNullable(O.option.map(event.image, i => <img src={i.src} />))}
      {renderMarkdownAST(event.htmlAst)}
    </VerticalTimelineElement>
  )
}

const Timeline: React.FC<TimelineProps> = ({ events }) => (
  <VerticalTimeline animate={false}>
    {events.map(event => TimelineItem({ event }))}
  </VerticalTimeline>
)

export default Timeline
