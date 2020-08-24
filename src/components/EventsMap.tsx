import {
  EventMarkdownRemark,
  PointIO,
  EventFrontmatter,
  EventType,
} from "@models/event"
import * as O from "fp-ts/lib/Option"
import { pipe } from "fp-ts/lib/pipeable"
import { navigate } from "gatsby"
import * as React from "react"
import * as topojson from "topojson-client"
import { Topology, GeometryCollection } from "topojson-specification"
import GeoCustom from "./GeoCustom/GeoCustom"

interface EventsMapProps {
  events: EventMarkdownRemark[]
  width: number
  height: number
}

interface GEOJSONEventPoint extends PointIO {
  properties: EventFrontmatter
}

const colorMap: Record<EventType, string> = {
  AntiEcologicAct: "brown",
  AnthropicDisaster: "red",
  NaturalDisaster: "yellow",
  Fact: "blue",
  EcologicAct: "green",
  War: "black",
  Migration: "orange",
  CivilConflict: "grey",
  Declaration: "lightgreen",
}

const getColor = (e: EventFrontmatter): string => {
  return pipe(
    e.type,
    O.map((type) => colorMap[type]),
    O.getOrElse(() => "white")
  )
}

const EventsMap: React.FC<EventsMapProps> = ({ events, width, height }) => {
  const initialAcc: GEOJSONEventPoint[] = []

  const eventPoints: Topology<{
    points: GeometryCollection<EventFrontmatter>
  }> = {
    type: "Topology",
    arcs: [],
    objects: {
      points: {
        type: "GeometryCollection",
        geometries: events.reduce((acc, e) => {
          if (O.isNone(e.frontmatter.location)) {
            return acc
          }
          return acc.concat([
            {
              ...e.frontmatter.location.value,
              properties: e.frontmatter,
            },
          ])
        }, initialAcc),
      },
    },
  }

  const data = topojson.feature(eventPoints, eventPoints.objects.points)

  return (
    <div
      style={{
        marginLeft: "auto",
        marginRight: "auto",
        marginTop: 20,
        marginBottom: 20,
      }}
    >
      <GeoCustom<GEOJSONEventPoint>
        projection="equalEarth"
        width={width}
        height={height}
        data={data as any}
        featureRenderer={(f, i) => {
          const color = getColor(f.feature.properties)
          return (
            <path
              key={`map-feature-${i}`}
              d={f.path ?? ""}
              stroke={color}
              strokeWidth={0.5}
              fill={color}
              onClick={async () => {
                await navigate(`/events#${f.feature.properties.uuid}`)
              }}
            />
          )
        }}
      />
    </div>
  )
}

export default EventsMap
