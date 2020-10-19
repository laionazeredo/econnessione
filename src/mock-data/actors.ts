import { ActorFrontmatter } from "@models/actor"
import { generateRandomColor } from "@utils/colors"
import uuid from "@utils/uuid"
import * as O from "fp-ts/lib/Option"
import { firstActorAvatar, secondActorAvatar } from "./avatars"


export const firstActor: ActorFrontmatter = {
  uuid: uuid(),
  fullName: "First Actor",
  username: "first-actor",
  date: new Date(),
  avatar: O.some(firstActorAvatar),
  color: generateRandomColor(),
}

export const secondActor: ActorFrontmatter = {
  uuid: uuid(),
  fullName: "Second Actor",
  username: "second-actor",
  date: new Date(),
  avatar: O.some(secondActorAvatar),
  color: generateRandomColor(),
}

export const actors = [firstActor, secondActor]