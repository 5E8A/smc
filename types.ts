
export interface ContentSection {
  header?: string;
  paragraph?: string;
  image?: string;
  imageCaption?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  author: string;
  date: string;
  category: string;
  coverImage: string;
  summary: string;
  carouselImages: string[];
  content: ContentSection[];
}

export interface WikiDoc {
  id: string;
  slug: string;
  title: string;
  author: string;
  date: string;
  category: string;
  coverImage: string;
  summary: string;
  carouselImages: string[];
  content: ContentSection[];
}
