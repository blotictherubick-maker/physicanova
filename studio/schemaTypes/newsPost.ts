import {defineField, defineType} from 'sanity'

export const newsPost = defineType({
  name: 'newsPost',
  title: 'Haber & Duyuru',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Başlık',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Kısa Özet',
      type: 'text',
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: 'coverImage',
      title: 'Kapak Görseli',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'publishedAt',
      title: 'Yayın Tarihi',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Kategori',
      type: 'string',
      options: {
        list: [
          {title: 'Duyuru', value: 'Duyuru'},
          {title: 'Haber', value: 'Haber'},
          {title: 'Video', value: 'Video'},
          {title: 'Blog', value: 'Blog'},
        ],
      },
      initialValue: 'Haber',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'featured',
      title: 'Öne Çıkan',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'isPublished',
      title: 'Yayında mı?',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'youtubeUrl',
      title: 'YouTube Video URL',
      type: 'url',
      description: 'Eğer haberde bir video varsa YouTube linkini buraya ekleyebilirsiniz.',
    }),
    defineField({
      name: 'body',
      title: 'İçerik',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO Başlığı',
      type: 'string',
      group: 'seo',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Açıklaması',
      type: 'text',
      group: 'seo',
    }),
  ],
  groups: [
    {
      name: 'seo',
      title: 'SEO Ayarları',
    },
  ],
  preview: {
    select: {
      title: 'title',
      date: 'publishedAt',
      category: 'category',
      media: 'coverImage',
      featured: 'featured',
    },
    prepare(selection) {
      const {title, date, category, media, featured} = selection
      const formattedDate = date ? new Date(date).toLocaleDateString('tr-TR') : ''
      const subtitle = `${formattedDate} | ${category} ${featured ? '⭐' : ''}`
      return {
        title: title,
        subtitle: subtitle,
        media: media,
      }
    },
  },
})
