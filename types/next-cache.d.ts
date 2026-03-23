// Extend Next.js cache tag registry to accept any string
// This allows revalidateTag() to be called with dynamic string values
// See: https://nextjs.org/docs/app/api-reference/functions/revalidateTag

import type { } from 'next'

declare module 'next' {
  interface Fetch {
    revalidateTag(tag: string): void
  }
}
