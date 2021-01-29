import { EventPageContent } from "@components/EventPageContent";
import { Layout } from "@components/Layout";
import { MainContent } from "@components/MainContent";
import SEO from "@components/SEO";
import { Events } from "@econnessione/shared/lib/io/http";
import { renderValidationErrors } from "@utils/renderValidationErrors";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";
// import { navigate } from "gatsby"
import * as t from "io-ts";
import React from "react";

interface EventTemplatePageProps {
  // navigate: typeof navigate
  // `data` prop will be injected by the GraphQL query below.
  data: {
    pageContent: { childMdx: unknown };
  };
}

const EventTemplate: React.FC<EventTemplatePageProps> = ({ data }) => {
  return pipe(
    Events.Event.decode(data.pageContent.childMdx),
    E.filterOrElse(
      Events.Uncategorized.Uncategorized.is,
      (value): t.Errors => [
        {
          value,
          context: [
            t.getContextEntry("event", Events.Uncategorized.UncategorizedMD),
          ],
        },
      ]
    ),
    E.fold(renderValidationErrors, (pageContent) => {
      return (
        <Layout>
          <SEO title={pageContent.title} />
          {/* <FlexGridItem>
            <CalendarHeatmap
              width={1000}
              height={300}
              events={events}
              onCircleClick={async event => {
                await navigate(`#${event.id}`)
              }}
            />
            </FlexGridItem> */}
          <MainContent>
            <EventPageContent event={pageContent} actors={[]} groups={[]} />
          </MainContent>
        </Layout>
      );
    })
  );
};

// export const pageQuery = graphql`
//   query EventTemplateQuery($eventUUID: String!) {
//     pageContent: file(
//       name: { eq: $eventUUID }
//       sourceInstanceName: { eq: "events" }
//     ) {
//       childMdx {
//         ...EventMD
//       }
//     }
//   }
// `

export default EventTemplate;