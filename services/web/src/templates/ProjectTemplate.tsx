import { ErrorBox } from "@econnessione/shared/components/Common/ErrorBox";
import { Loader } from "@econnessione/shared/components/Common/Loader";
import { MainContent } from "@econnessione/shared/components/MainContent";
import { ProjectPageContent } from "@econnessione/shared/components/ProjectPageContent";
import SEO from "@econnessione/shared/components/SEO";
import { eventMetadataMapEmpty } from "@econnessione/shared/mock-data/events/events-metadata";
import { project } from "@econnessione/shared/providers/DataProvider";
import { RouteComponentProps } from "@reach/router";
import * as QR from "avenger/lib/QueryResult";
import { WithQueries } from "avenger/lib/react";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import React from "react";

export default class ProjectTemplate extends React.PureComponent<
  RouteComponentProps<{ projectId: string }>
> {
  render(): JSX.Element {
    // eslint-disable-next-line
    console.log(this.props);

    return pipe(
      O.fromNullable(this.props.projectId),
      O.fold(
        () => <div>Missing project id</div>,
        (projectId) => (
          <WithQueries
            queries={{ project: project }}
            params={{ project: { id: projectId } }}
            render={QR.fold(Loader, ErrorBox, ({ project }) => (
              <MainContent>
                <SEO title={project.name} />
                <ProjectPageContent
                  {...project}
                  metadata={eventMetadataMapEmpty}
                />
              </MainContent>
            ))}
          />
        )
      )
    );
  }
}
