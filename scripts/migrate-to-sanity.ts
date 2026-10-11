/**
 * One-shot import of content/site.json (+ assets) into Sanity.
 * Run from studio-cnd: npm run migrate
 */
import {createReadStream, existsSync} from 'node:fs'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {getCliClient} from 'sanity/cli'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type SiteProduct = {
  id: string
  name: string
  description: string
  detailHtml: string
  price: number
  image: string
  city: string
}

type SiteJson = {
  products: SiteProduct[]
  about: string[]
  founder: {name: string; role: string; bio: string; image: string}
  team: {name: string; role: string; image: string}[]
  contacts: {
    phone: string
    email: string
    address: string
    whatsapp: string
    telegram: string
    instagram: string
  }
  quiz: {title: string; options: string[]; images?: string[]}[]
  logo: string
  quizIntro: string
  teamDescription: string
}

type PdfMap = {byName: Record<string, string>}

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')

const CYR_TO_LAT: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
}

function slugifyName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .split('')
    .map((ch) => CYR_TO_LAT[ch] ?? ch)
    .join('')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

function publicPathToFile(urlPath: string) {
  const cleaned = urlPath.replace(/^\//, '')
  return path.join(PUBLIC, cleaned)
}

async function main() {
  const client = getCliClient({apiVersion: '2026-10-11'})

  const site = JSON.parse(
    await readFile(path.join(ROOT, 'content/site.json'), 'utf8'),
  ) as SiteJson
  const pdfs = JSON.parse(
    await readFile(path.join(ROOT, 'content/project-pdfs.json'), 'utf8'),
  ) as PdfMap

  const imageCache = new Map<string, {_type: 'image'; asset: {_type: 'reference'; _ref: string}}>()

  async function uploadImage(urlPath: string) {
    if (!urlPath) return undefined
    const cached = imageCache.get(urlPath)
    if (cached) return cached

    const filePath = publicPathToFile(urlPath)
    if (!existsSync(filePath)) {
      console.warn(`Missing image: ${urlPath}`)
      return undefined
    }

    const asset = await client.assets.upload('image', createReadStream(filePath), {
      filename: path.basename(filePath),
    })
    const image = {
      _type: 'image' as const,
      asset: {_type: 'reference' as const, _ref: asset._id},
    }
    imageCache.set(urlPath, image)
    console.log(`Uploaded image ${urlPath} → ${asset._id}`)
    return image
  }

  // --- products ---
  for (const [index, product] of site.products.entries()) {
    const slug = slugifyName(product.name)
    const existing = await client.fetch<{_id: string} | null>(
      `*[_type == "product" && legacyId == $legacyId][0]{_id}`,
      {legacyId: product.id},
    )

    const image = await uploadImage(product.image)
    if (!image) {
      throw new Error(`Product image required: ${product.name}`)
    }

    const doc = {
      _type: 'product' as const,
      name: product.name,
      slug: {_type: 'slug' as const, current: slug},
      legacyId: product.id,
      description: product.description,
      detailHtml: product.detailHtml,
      price: product.price,
      city: product.city,
      image,
      projectPdf: pdfs.byName[product.name] || undefined,
      sortOrder: index,
    }

    if (existing?._id) {
      await client.patch(existing._id).set(doc).commit()
      console.log(`Updated product ${product.name}`)
    } else {
      await client.create(doc)
      console.log(`Created product ${product.name}`)
    }
  }

  // --- site settings singleton ---
  const logo = await uploadImage(site.logo)
  const founderImage = await uploadImage(site.founder.image)

  const team = []
  for (const member of site.team) {
    team.push({
      _type: 'teamMember' as const,
      _key: slugifyName(member.name) || `member-${team.length}`,
      name: member.name,
      role: member.role,
      image: await uploadImage(member.image),
    })
  }

  const quiz = []
  for (const [qIndex, question] of site.quiz.entries()) {
    const images = []
    if (question.images?.length) {
      for (const img of question.images) {
        const uploaded = await uploadImage(img)
        if (uploaded) {
          images.push({...uploaded, _key: `q${qIndex}-${images.length}`})
        }
      }
    }
    quiz.push({
      _type: 'quizQuestion' as const,
      _key: `quiz-${qIndex}`,
      title: question.title,
      options: question.options,
      ...(images.length ? {images} : {}),
    })
  }

  const settings = {
    _id: 'siteSettings',
    _type: 'siteSettings' as const,
    logo,
    quizIntro: site.quizIntro,
    teamDescription: site.teamDescription,
    about: site.about,
    founder: {
      _type: 'founder' as const,
      name: site.founder.name,
      role: site.founder.role,
      bio: site.founder.bio,
      image: founderImage,
    },
    team,
    contacts: {
      _type: 'contacts' as const,
      ...site.contacts,
    },
    quiz,
  }

  await client.createOrReplace(settings)
  console.log('Upserted siteSettings')
  console.log('Migration complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
