import { fetchAirtableItems } from '@/lib/airtable'
import FreigabeManagementClient from './FreigabeManagementClient'
import { Suspense } from 'react'

interface AirtableItem {
  id: string
  fields: {
    Titel: string
    Type: string
    Beschreibung: string
    Status?: string
    Anhang?: Array<{
      id: string
      url: string
    }>
    'Frage vom Kunden'?: string
  }
}

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
export default async function Home() {
  try {
    const initialItems = await fetchAirtableItems();
    
    // Filter items to only include those with empty status
    const pendingItems = initialItems.filter((item: AirtableItem) => 
      !item.fields.Status || item.fields.Status === ""
    );

    // Format items for FreigabeManagementClient
    const formattedItems = pendingItems.map((item: AirtableItem) => ({
      id: item.id,
      title: item.fields.Titel,
      type: item.fields.Type,
      description: item.fields.Beschreibung,
      fields: {
        Anhang: item.fields.Anhang
      },
      attachment: item.fields.Anhang?.[0],
      status: "" as "JA" | "NEIN" | "?"
    }));

    return (
      <Suspense fallback={<div>Laden...</div>}>
        <FreigabeManagementClient initialItems={formattedItems} />
      </Suspense>
    )
  } catch (error) {
    return <ErrorFallback />
  }
}

