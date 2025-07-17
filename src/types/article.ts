import { Tags } from "@prisma/client";

export interface ArticleCreateInput {
  title: string;
  content: string;
  tags?: Tags[];
  isPublic?: boolean;
  authorId: string;
}

export interface ArticleUpdateInput {
  title?: string;
  content?: string;
  tags?: Tags[];
  isPublic?: boolean;
}

export interface ArticleFilterOptions {
  tags?: Tags[];
  isPublic?: boolean;
}
