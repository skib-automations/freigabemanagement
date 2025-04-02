import { fetchAirtableItems } from '@/lib/airtable'
import FreigabeManagementClient from './FreigabeManagementClient'
import { Suspense } from 'react'
import Image from 'next/image'

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
    Kunde: string
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
export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  try {
    // Get customer from URL params
    const kunde = searchParams.kunde as string;

    // Show message if no customer is selected
    if (!kunde) {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">FREIGABE MANAGEMENT</h1>
            <p className="text-xl md:text-2xl text-gray-700">
              Bitte wählen Sie einen Kunden aus (z. B. ?kunde=Real%20Estate).
            </p>
          </div>
        </main>
      );
    }
    
    const rawItems = await fetchAirtableItems();
    const initialItems = rawItems as unknown as AirtableItem[];
    
    // Debug logging
    console.log('URL Parameter kunde:', kunde);
    console.log('All Kunde values in Airtable:', initialItems.map(item => ({
      Kunde: item.fields.Kunde,
      Status: item.fields.Status
    })));
    
    // Filter items by empty status and customer (case-insensitive with normalization)
    const pendingItems = initialItems.filter((item: AirtableItem) => {
      const isUnlabeled = !item.fields.Status || item.fields.Status === "";
      const normalizedKundeField = item.fields.Kunde 
        ? item.fields.Kunde.replace(/\s+/g, ' ').trim().toLowerCase()
        : '';
      const normalizedKundeParam = kunde 
        ? kunde.replace(/\s+/g, ' ').trim().toLowerCase()
        : '';
      const matchesKunde = normalizedKundeField === normalizedKundeParam;
      
      // Debug individual item matching
      console.log('Item:', {
        Kunde: item.fields.Kunde,
        NormalizedKundeField: normalizedKundeField,
        NormalizedKundeParam: normalizedKundeParam,
        MatchesKunde: matchesKunde,
        IsUnlabeled: isUnlabeled
      });
      
      return isUnlabeled && matchesKunde;
    });

    // Debug filtered results
    console.log('Filtered pendingItems:', {
      total: pendingItems.length,
      items: pendingItems.map(item => ({
        id: item.id,
        kunde: item.fields.Kunde,
        status: item.fields.Status,
        title: item.fields.Titel
      }))
    });

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
      status: "" as "JA" | "NEIN" | "?",
      question: item.fields['Frage vom Kunden'],
      kunde: item.fields.Kunde // Pass the original customer name from Airtable
    }));

    return (
      <Suspense fallback={<div>Laden...</div>}>
        <FreigabeManagementClient initialItems={formattedItems} kunde={kunde} />
      </Suspense>
    )
  } catch (error) {
    console.error('Error in Home component:', error);
    return <ErrorFallback />
  }
}

