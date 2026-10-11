import type {StructureResolver} from 'sanity/structure'
import {CogIcon} from '@sanity/icons/Cog'
import {HomeIcon} from '@sanity/icons/Home'

const SINGLETONS = ['siteSettings']

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Контент')
    .items([
      S.listItem()
        .title('Настройки сайта')
        .icon(CogIcon)
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.divider(),
      S.listItem()
        .title('ЖК')
        .icon(HomeIcon)
        .child(
          S.documentTypeList('product')
            .title('ЖК')
            .defaultOrdering([{field: 'sortOrder', direction: 'asc'}]),
        ),
      ...S.documentTypeListItems().filter(
        (item) => !SINGLETONS.includes(item.getId() ?? '') && item.getId() !== 'product',
      ),
    ])
