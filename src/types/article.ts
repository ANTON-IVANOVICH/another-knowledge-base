export interface ArticleCreateInput {
  title: string;
  content: string;
  tags?: string[];
  isPublic?: boolean;
  authorId: string;
}

export interface ArticleUpdateInput {
  title?: string;
  content?: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface ArticleFilterOptions {
  tags?: string[];
  isPublic?: boolean;
  authorId?: string;
  search?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "title";
  sortOrder?: "asc" | "desc";
}
