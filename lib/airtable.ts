// Airtable API Konfiguration
// Hinweis: Diese Umgebungsvariablen müssen in .env.local für die lokale Entwicklung
// und in den Vercel Environment Variables für die Produktion definiert werden.
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const AIRTABLE_TABLE_NAME = 'Items'

// Überprüfe, ob die notwendigen Umgebungsvariablen verfügbar sind
const isConfigured = AIRTABLE_API_KEY && AIRTABLE_BASE_ID

// TypeScript Interfaces für Airtable Daten
export interface Attachment {
  id: string
  url: string
  filename?: string
  type?: string
}

export interface AirtableItem {
  id: string
  fields: {
    Titel: string
    Beschreibung: string
    Anhang?: Attachment[]
    Type: string
    Kunde: string
    Status: 'JA' | 'NEIN' | '?'
    'Frage vom Kunden'?: string
  }
}

export interface AirtableResponse {
  records: Array<{
    id: string
    fields: Record<string, any>
  }>
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
export async function fetchAirtableItems() {
  try {
    // Construct URL without any filters or views
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
    
    console.log('Fetching from Airtable URL:', url);
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    const data: AirtableResponse = await response.json();
    
    // Debug raw API response
    console.log('Raw Airtable API response:', {
      totalRecords: data.records.length,
      sampleRecord: data.records[0],
      allKundeValues: data.records.map(record => record.fields.Kunde)
    });

    return data.records;
  } catch (error) {
    console.error('Error fetching from Airtable:', error);
    throw error;
  }
}

interface AirtableError {
  error: {
    type?: string
    message?: string
  }
}

/**
 * Aktualisiert den Status und optional die Frage eines Items
 * Gibt ein Objekt mit success und optional einer detaillierten Fehlermeldung zurück
 */
export async function updateAirtableItem(
  id: string,
  status: 'JA' | 'NEIN' | '?',
  question?: string
): Promise<{ success: boolean; error?: string }> {
  // Konfigurationsprüfung
  if (!isConfigured) {
    return {
      success: false,
      error: 'Airtable ist nicht konfiguriert. Bitte AIRTABLE_API_KEY und AIRTABLE_BASE_ID in .env.local oder Vercel Environment Variables definieren.'
    }
  }

  // Record ID Validierung
  if (!id.match(/^rec[a-zA-Z0-9]{14}$/)) {
    return {
      success: false,
      error: 'Ungültige Record ID. Die ID muss mit "rec" beginnen und 17 Zeichen lang sein.'
    }
  }

  try {
    // Status-Mapping für Airtable
    const statusMap = {
      'JA': 'Freigegeben',
      'NEIN': 'Abgelehnt',
      '?': 'Frage'
    }

    // Felder für das Update vorbereiten
    const fields: Record<string, string> = {
      'Status': statusMap[status]
    }

    if (question) {
      fields['Frage vom Kunden'] = question
    }

    // Rate-Limit: 200ms Verzögerung
    await new Promise(resolve => setTimeout(resolve, 200))

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${id}`,
      {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ fields }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json() as AirtableError
      
      // Spezifische Fehlermeldungen basierend auf dem Statuscode
      switch (response.status) {
        case 401:
          return { success: false, error: 'Ungültiger API-Schlüssel. Bitte überprüfen Sie Ihre Airtable-Konfiguration.' }
        case 404:
          return { success: false, error: 'Record nicht gefunden. Bitte überprüfen Sie die Record ID.' }
        case 422:
          return { success: false, error: `Ungültige Daten: ${errorData.error?.message || 'Bitte überprüfen Sie die Feldnamen und Werte.'}` }
        case 429:
          return { success: false, error: 'Rate-Limit erreicht. Bitte warten Sie einen Moment.' }
        default:
          return { success: false, error: errorData.error?.message || `Airtable API Fehler: ${response.statusText}` }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating Airtable:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten.'
    }
  }
} 