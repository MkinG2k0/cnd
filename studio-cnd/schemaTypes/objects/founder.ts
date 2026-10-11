import {defineField, defineType} from 'sanity'

export const founder = defineType({
  name: 'founder',
  title: 'Основатель',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      title: 'Имя',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Должность',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'bio',
      title: 'Биография',
      type: 'text',
      rows: 5,
    }),
    defineField({
      name: 'image',
      title: 'Фото',
      type: 'image',
      options: {hotspot: true},
    }),
  ],
})
