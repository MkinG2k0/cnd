import {defineField, defineType} from 'sanity'
import {HomeIcon} from '@sanity/icons/Home'

export const product = defineType({
  name: 'product',
  title: 'ЖК',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Название',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'legacyId',
      title: 'Старый ID',
      type: 'string',
      description: 'Идентификатор из прежней версии сайта',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'description',
      title: 'Краткое описание',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'detailHtml',
      title: 'Подробное описание (HTML)',
      type: 'text',
      rows: 12,
      description: 'Допускается простой HTML: br, strong',
    }),
    defineField({
      name: 'price',
      title: 'Цена от, ₽/м²',
      type: 'number',
      validation: (rule) => rule.required().positive(),
    }),
    defineField({
      name: 'city',
      title: 'Город',
      type: 'string',
      options: {
        list: [
          {title: 'Махачкала', value: 'Махачкала'},
          {title: 'Каспийск', value: 'Каспийск'},
          {title: 'Дербент', value: 'Дербент'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Главное фото',
      type: 'image',
      options: {hotspot: true},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'projectPdf',
      title: 'Проектная документация (URL)',
      type: 'string',
      description: 'Путь на сайте, например /projects/moskovskiy.pdf',
    }),
    defineField({
      name: 'sortOrder',
      title: 'Порядок в каталоге',
      type: 'number',
      initialValue: 0,
    }),
  ],
  orderings: [
    {
      title: 'Порядок в каталоге',
      name: 'sortOrderAsc',
      by: [{field: 'sortOrder', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'city',
      media: 'image',
    },
  },
})
