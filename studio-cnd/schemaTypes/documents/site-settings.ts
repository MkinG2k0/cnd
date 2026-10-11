import {defineArrayMember, defineField, defineType} from 'sanity'
import {CogIcon} from '@sanity/icons/Cog'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Настройки сайта',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'logo',
      title: 'Логотип',
      type: 'image',
      options: {hotspot: true},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'quizIntro',
      title: 'Текст под заголовком (герой)',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'teamDescription',
      title: 'Описание блока команды',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'about',
      title: 'О компании',
      type: 'array',
      of: [defineArrayMember({type: 'text'})],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'founder',
      title: 'Основатель',
      type: 'founder',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'team',
      title: 'Команда',
      type: 'array',
      of: [defineArrayMember({type: 'teamMember'})],
    }),
    defineField({
      name: 'contacts',
      title: 'Контакты',
      type: 'contacts',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'quiz',
      title: 'Квиз',
      type: 'array',
      of: [defineArrayMember({type: 'quizQuestion'})],
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Настройки сайта'}
    },
  },
})
