import { MarkdownRenderer } from "@components/Common/MarkdownRenderer";
import { Actor, Events, Group, Project } from "@io/http";
import { GroupMember } from "@io/http/GroupMember";
import { Grid, Typography } from "@material-ui/core";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import * as React from "react";
import { ActorList } from "./lists/ActorList";
import GroupList from "./lists/GroupList";

export interface GroupPageContentProps extends Group.Group {
  groupMembers: GroupMember[];
  events: Events.Event[];
  projects: Project.Project[];
  funds: Events.ProjectTransaction[];
  onMemberClick: (m: Actor.ActorFrontmatter) => void;
}

export const GroupPageContent: React.FC<GroupPageContentProps> = ({
  onMemberClick,
  projects,
  funds,
  events,
  body,
  groupMembers,
  ...frontmatter
}) => {
  // const projectFundsInitMap: Map<string, number> = Map.empty;
  // const projectFundsMap = pipe(
  //   funds,
  //   A.reduce(projectFundsInitMap, (acc, f) => {
  //     return pipe(
  //       acc,
  //       Map.lookup(Eq.eqString)(f.project),
  //       O.map((amount) => amount + f.transaction.amount),
  //       O.getOrElse(() => f.transaction.amount),
  //       (value) => Map.insertAt(Eq.eqString)(f.project, value)(acc)
  //     );
  //   })
  // );

  return (
    <Grid container>
      <Grid item>
        {/* <div>
          <EditButton resourceName="groups" resource={frontmatter} />
        </div> */}
      </Grid>
      <Grid container direction="column">
        <Grid item>
          {pipe(
            O.fromNullable(frontmatter.avatar),
            O.fold(
              () => <div />,
              (src) => <img src={src} style={{ width: "100px" }} />
            )
          )}
          <Typography variant="h2">{frontmatter.name}</Typography>
        </Grid>
        <Grid>
          <div>
            <Typography variant="h6">Sotto Gruppi</Typography>
            <GroupList groups={[]} onGroupClick={() => {}} />
          </div>

          <div>
            <Typography variant="h6">Members</Typography>
            <ActorList
              actors={groupMembers.map((a) => ({ ...a.actor, selected: true }))}
              onActorClick={onMemberClick}
              avatarSize="medium"
            />
          </div>

          <div>
            {/* <h4>Progetti</h4> */}
            {/* {pipe(
              projectFundsMap,
              Map.toArray(Ord.ordString),
              A.map(([name, value]) => (
                <LabelMedium key={`group-page-content-${name}`}>
                  {name} {value} euro
                </LabelMedium>
              ))
            )} */}
          </div>
          <MarkdownRenderer>{body}</MarkdownRenderer>
        </Grid>
      </Grid>
      {/* <Grid width="100%">
        <EventsNetwork
          events={events.filter(UncategorizedMD.is)}
          selectedGroupIds={[frontmatter.id]}
          selectedActorIds={[]}
          selectedTopicIds={[]}
          scale={"all"}
          scalePoint={O.none}
        />
      </Grid> */}
    </Grid>
  );
};
