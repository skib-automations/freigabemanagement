import { fetchAirtableItems } from '@/lib/airtable'
import FreigabeManagementClient from './FreigabeManagementClient'
import { Suspense } from 'react'
import Image from 'next/image'
import { ErrorFallback } from '@/components/ErrorFallback' // Importiere die neue Komponente

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

interface SearchParams {
  [key: string]: string | string[] | undefined
}

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  try {
    const params = await searchParams
    const kunde = params.kunde as string

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
      )
    }
    
    const rawItems = await fetchAirtableItems()
    const initialItems = rawItems as unknown as AirtableItem[]
    
    console.log('URL Parameter kunde:', kunde)
    console.log('All Kunde values in Airtable:', initialItems.map(item => ({
      Kunde: item.fields.Kunde,
      Status: item.fields.Status
    })))
    
    const pendingItems = initialItems.filter((item: AirtableItem) => {
      const isUnlabeled = !item.fields.Status || item.fields.Status === ""
      const normalizedKundeField = item.fields.Kunde 
        ? item.fields.Kunde.replace(/\s+/g, ' ').trim().toLowerCase()
        : ''
      const normalizedKundeParam = kunde 
        ? kunde.replace(/\s+/g, ' ').trim().toLowerCase()
        : ''
      const matchesKunde = normalizedKundeField === normalizedKundeParam
      
      console.log('Item:', {
        Kunde: item.fields.Kunde,
        NormalizedKundeField: normalizedKundeField,
        NormalizedKundeParam: normalizedKundeParam,
        MatchesKunde: matchesKunde,
        IsUnlabeled: isUnlabeled
      })
      
      return isUnlabeled && matchesKunde
    })

    console.log('Filtered pendingItems:', {
      total: pendingItems.length,
      items: pendingItems.map(item => ({
        id: item.id,
        kunde: item.fields.Kunde,
        status: item.fields.Status,
        title: item.fields.Titel
      }))
    })

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
      kunde: item.fields.Kunde
    }))

    return (
      <Suspense fallback={<div>Laden...</div>}>
        <FreigabeManagementClient initialItems={formattedItems} kunde={kunde} />
      </Suspense>
    )
  } catch (error) {
    console.error('Error in Home component:', error)
    return <ErrorFallback />
  }
}

export const dynamic = 'force-dynamic' // Erzwingt dynamisches Rendering