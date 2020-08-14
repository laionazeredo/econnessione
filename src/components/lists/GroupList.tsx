import { List, ListItemProps } from "@components/Common/List"
import { GroupFrontmatter } from "@models/group"
import { Avatar } from "baseui/avatar"
import * as O from "fp-ts/lib/Option"
import { pipe } from "fp-ts/lib/pipeable"
import * as React from "react"
import { AvatarScale } from "./ActorList"

export interface Group extends GroupFrontmatter {
  selected: boolean
}

interface GroupListProps {
  groups: Group[]
  onGroupClick: (actor: Group) => void
  avatarScale: AvatarScale
}

const GroupListItem: ({
  avatarScale,
}: {
  avatarScale: AvatarScale
}) => React.FC<ListItemProps<Group>> = ({ avatarScale }) => ({
  item,
  onClick,
}) => {
  return (
    <div
      key={item.uuid}
      style={{ display: "inline-block", margin: 5, cursor: "pointer" }}
      onClick={() => {
        onClick(item)
      }}
    >
      {pipe(
        item.avatar,
        O.map((src) => (
          <Avatar
            key={item.uuid}
            name={item.name}
            size={avatarScale}
            src={src.childImageSharp.fluid.src}
          />
        )),
        O.toNullable
      )}
      <div
        style={{
          width: "100%",
          height: 3,
          backgroundColor: item.selected
            ? pipe(
                item.color,
                O.getOrElse(() => "white")
              )
            : "white",
        }}
      />
    </div>
  )
}

const GroupList: React.FC<GroupListProps> = ({
  groups,
  onGroupClick,
  avatarScale,
}) => {
  return (
    <List
      data={groups}
      filter={(_) => true}
      onItemClick={onGroupClick}
      getKey={(g) => g.uuid}
      ListItem={GroupListItem({ avatarScale })}
    />
  )
}

export default GroupList
