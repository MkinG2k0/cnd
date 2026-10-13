export const PRODUCTS_QUERY = `*[_type == "product"] | order(sortOrder asc) {
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
}`;

export const PRODUCT_BY_SLUG_QUERY = `*[_type == "product" && slug.current == $slug][0] {
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
}`;

export const SITE_SETTINGS_QUERY = `*[_id == "siteSettings"][0]{
  quizIntro,
  about,
  founder{ name, role, bio, image },
  contacts{ phone, email, address, whatsapp, telegram, instagram },
  quiz[]{ title, options, images }
}`;
