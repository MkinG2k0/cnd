import {defineField, defineType} from 'sanity'
import {UserIcon} from '@sanity/icons/User'

export const teamMember = defineType({
  name: 'teamMember',
  title: 'Сотрудник',
  type: 'object',
  icon: UserIcon,
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
      name: 'image',
      title: 'Фото',
      type: 'image',
      options: {hotspot: true},
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'role', media: 'image'},
  },
})
