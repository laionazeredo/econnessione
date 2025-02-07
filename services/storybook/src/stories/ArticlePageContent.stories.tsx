import {
  ArticlePageContent,
  ArticlePageContentProps
} from "@econnessione/shared/components/ArticlePageContent";
import { firstArticle } from "@econnessione/shared/mock-data/articles";
import { Meta, Story } from "@storybook/react/types-6-0";
import * as React from "react";

const meta: Meta = {
  title: "Components/Pages/ArticlePageContent",
  component: ArticlePageContent,
};

export default meta;

const Template: Story<ArticlePageContentProps> = (props) => {
  return <ArticlePageContent {...props} />;
};

const ArticlePageContentExample = Template.bind({});

const args: ArticlePageContentProps = {
  ...firstArticle,
  // tableOfContents: O.none,
  // timeToRead: O.none,
};

ArticlePageContentExample.args = args;

export { ArticlePageContentExample };
