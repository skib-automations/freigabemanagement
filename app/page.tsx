import { fetchAirtableItems } from '@/lib/airtable'
import FreigabeManagementClient from './FreigabeManagementClient'
import { Suspense } from 'react'

// Error Boundary Komponente für Fehlerbehandlung
function ErrorFallback() {
  return (
    <div className="min-h-screen bg-[#F1F1F1] p-4 md:p-8 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full text-center shadow-lg">
        <h2 className="text-xl font-bold mb-4">Oops! Etwas ist schiefgelaufen.</h2>
        <p className="text-gray-600 mb-6">Bitte laden Sie die Seite neu oder versuchen Sie es später noch einmal.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
        >
          Neu laden
        </button>
      </div>
    </div>
  )
}

// Server Component für das initiale Daten-Fetching
export default async function FreigabeManagementPage() {
  try {
    // Lade Daten von Airtable
    const items = await fetchAirtableItems()

    if (items.length === 0) {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Freigabe Management</h1>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Keine Daten verfügbar. Bitte überprüfen Sie die Airtable-Konfiguration und Ihre Internetverbindung.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      )
    }

    // Wandle Airtable-Daten in das erwartete Format um
    const formattedItems = items.map(item => ({
      id: item.id,
      title: item.fields.Titel,
      type: item.fields.Type,
      description: item.fields.Beschreibung,
      attachment: item.fields.Anhang?.[0],
      status: item.fields.Status,
      question: item.fields['Frage vom Kunden']
    }))

    return (
      <Suspense fallback={<div>Laden...</div>}>
        <FreigabeManagementClient initialItems={formattedItems} />
      </Suspense>
    )
  } catch (error) {
    return <ErrorFallback />
  }
}

