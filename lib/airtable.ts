// Airtable API Konfiguration
// Hinweis: Diese Umgebungsvariablen müssen in .env.local für die lokale Entwicklung
// und in den Vercel Environment Variables für die Produktion definiert werden.
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const AIRTABLE_TABLE_NAME = 'Items'

// Überprüfe, ob die notwendigen Umgebungsvariablen verfügbar sind
const isConfigured = AIRTABLE_API_KEY && AIRTABLE_BASE_ID

// TypeScript Interfaces für Airtable Daten
export interface AirtableItem {
  id: string
  fields: {
    Titel: string
    Beschreibung: string
    Anhang?: string[]
    Type: string
    Kunde: string
    Status: 'JA' | 'NEIN' | '?'
    'Frage vom Kunden'?: string
  }
}

export interface AirtableResponse {
  records: AirtableItem[]
}

// Airtable API Headers
const getHeaders = () => ({
  'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json',
})

/**
 * Lädt alle Items für Kunde A aus Airtable
 * Gibt eine leere Liste zurück, wenn die Konfiguration fehlt oder ein Fehler auftritt
 */
export async function fetchAirtableItems(): Promise<AirtableItem[]> {
  if (!isConfigured) {
    console.warn('Airtable ist nicht konfiguriert. Bitte AIRTABLE_API_KEY und AIRTABLE_BASE_ID in .env.local oder Vercel Environment Variables definieren.')
    return []
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula={Kunde}="Kunde A"`,
      { headers: getHeaders() }
    )

    if (!response.ok) {
      console.error(`Airtable API error: ${response.statusText}`)
      return []
    }

    const data: AirtableResponse = await response.json()
    return data.records
  } catch (error) {
    console.error('Error fetching from Airtable:', error)
    return []
  }
}

/**
 * Aktualisiert den Status und optional die Frage eines Items
 * Gibt false zurück, wenn die Aktualisierung fehlschlägt
 */
export async function updateAirtableItem(
  id: string,
  status: 'JA' | 'NEIN' | '?',
  question?: string
): Promise<boolean> {
  if (!isConfigured) {
    console.warn('Airtable ist nicht konfiguriert. Bitte AIRTABLE_API_KEY und AIRTABLE_BASE_ID in .env.local oder Vercel Environment Variables definieren.')
    return false
  }

  try {
    const fields: any = { Status: status }
    if (question) {
      fields['Frage vom Kunden'] = question
    }

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${id}`,
      {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ fields }),
      }
    )

    if (!response.ok) {
      console.error(`Airtable API error: ${response.statusText}`)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating Airtable:', error)
    return false
  }
} 