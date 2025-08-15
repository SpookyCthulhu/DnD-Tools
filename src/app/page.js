import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center mb-8">D&D Campaign Tools</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/map"
            className="block p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <div className="flex flex-col items-center">
              <svg className="w-16 h-16 text-purple-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <h2 className="text-xl font-semibold mb-2">Map Tool</h2>
              <p className="text-gray-600 text-center">
                Interactive battle maps with tokens, drawing tools, and vision blockers
              </p>
            </div>
          </Link>

          <Link
            href="/notebook"
            className="block p-6 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <div className="flex flex-col items-center">
              <svg className="w-16 h-16 text-indigo-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h2 className="text-xl font-semibold mb-2">Campaign Notebook</h2>
              <p className="text-gray-600 text-center">
                Organize your campaign with chapters, sections, and rich text notes
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Part of DMBeyond.com Tools Suite</p>
        </div>
      </div>
    </main>
  );
}