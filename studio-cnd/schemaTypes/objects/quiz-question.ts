import {defineArrayMember, defineField, defineType} from 'sanity'

export const quizQuestion = defineType({
  name: 'quizQuestion',
  title: 'Вопрос квиза',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Вопрос',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'options',
      title: 'Варианты ответа',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'images',
      title: 'Картинки к вариантам',
      type: 'array',
      of: [defineArrayMember({type: 'image', options: {hotspot: true}})],
      description: 'По порядку соответствуют вариантам ответа (необязательно)',
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})
