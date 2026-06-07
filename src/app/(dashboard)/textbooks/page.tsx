import { getTextbooks } from '@/lib/actions/textbooks'
import { TextbooksClient } from '@/components/textbooks/textbooks-client'

export default async function TextbooksPage() {
  const result = await getTextbooks()

  if (!result.success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-4 max-w-md text-center">
          <h2 className="text-sm font-semibold text-red-800">
            Failed to load textbooks
          </h2>
          <p className="text-sm text-red-600 mt-1">
            {result.error ?? 'An unexpected error occurred.'}
          </p>
        </div>
      </div>
    )
  }

  return <TextbooksClient textbooks={result.data ?? []} />
}
