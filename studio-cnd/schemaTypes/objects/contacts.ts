import {defineField, defineType} from 'sanity'

export const contacts = defineType({
  name: 'contacts',
  title: 'Контакты',
  type: 'object',
  fields: [
    defineField({
      name: 'phone',
      title: 'Телефон',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: 'address',
      title: 'Адрес',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'whatsapp',
      title: 'WhatsApp URL',
      type: 'url',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'telegram',
      title: 'Telegram URL',
      type: 'url',
    }),
    defineField({
      name: 'instagram',
      title: 'Instagram URL',
      type: 'url',
    }),
  ],
})
