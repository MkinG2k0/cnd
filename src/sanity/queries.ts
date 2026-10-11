import { defineQuery } from "next-sanity";

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_id == "siteSettings"][0]{
    logo,
    quizIntro,
    teamDescription,
    about,
    founder{
      name,
      role,
      bio,
      image
    },
    team[]{
      _key,
      name,
      role,
      image
    },
    contacts{
      phone,
      email,
      address,
      whatsapp,
      telegram,
      instagram
    },
    quiz[]{
      _key,
      title,
      options,
      images
    }
  }
`);

export const PRODUCTS_QUERY = defineQuery(`
  *[_type == "product"] | order(sortOrder asc) {
    _id,
    legacyId,
    name,
    "slug": slug.current,
    description,
    detailHtml,
    price,
    city,
    image,
    projectPdf,
    sortOrder
  }
`);
