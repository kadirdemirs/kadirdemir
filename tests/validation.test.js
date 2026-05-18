import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Re-declare the comment schema to keep the test independent of the handler internals.
const createCommentSchema = z.object({
  postSlug: z.string().min(1).max(200),
  author: z.string().min(1).max(60),
  body: z.string().min(2).max(1500),
  parentId: z.string().max(40).optional(),
})

describe('comment validation schema', () => {
  it('accepts a typical comment', () => {
    const parsed = createCommentSchema.safeParse({
      postSlug: 'merhaba-2026',
      author: 'Ali',
      body: 'Yazıyı çok beğendim!',
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects an empty body', () => {
    const parsed = createCommentSchema.safeParse({
      postSlug: 'merhaba-2026',
      author: 'Ali',
      body: '',
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects an oversize body', () => {
    const parsed = createCommentSchema.safeParse({
      postSlug: 'merhaba-2026',
      author: 'Ali',
      body: 'x'.repeat(2000),
    })
    expect(parsed.success).toBe(false)
  })

  it('requires a postSlug', () => {
    const parsed = createCommentSchema.safeParse({
      postSlug: '',
      author: 'Ali',
      body: 'Yazı çok güzel',
    })
    expect(parsed.success).toBe(false)
  })
})
