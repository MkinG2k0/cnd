export type Product = {
  id: string;
  sanityId: string;
  name: string;
  slug: string;
  description: string;
  detailHtml: string;
  price: number;
  city: string;
  imageUrl: string;
  galleryUrls: string[];
  projectPdf?: string;
};

export type QuizQuestion = {
  title: string;
  options: string[];
  images: string[];
};

export type SiteSettings = {
  quizIntro: string;
  about: string[];
  founder: { name: string; role: string; bio: string; imageUrl: string };
  contacts: {
    phone: string;
    email: string;
    address: string;
    whatsapp: string;
    telegram: string;
    instagram: string;
  };
  quiz: QuizQuestion[];
};
