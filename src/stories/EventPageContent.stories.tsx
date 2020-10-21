import {
  EventPageContent,
  EventPageContentProps
} from "@components/EventPageContent"
import { eventPageContentArgs } from "@components/examples/EventPageContentExample"
import { Meta, Story } from "@storybook/react/types-6-0"
import * as React from "react"

const meta: Meta = {
  title: "Components/Pages/EventPageContent",
  component: EventPageContent,
}

export default meta

const Template: Story<EventPageContentProps> = (props) => {
  return <EventPageContent {...props} />
}

const EventPageContentExample = Template.bind({})

EventPageContentExample.args = eventPageContentArgs

export { EventPageContentExample }
