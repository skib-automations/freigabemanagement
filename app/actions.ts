'use server'

import { updateAirtableItem } from '@/lib/airtable'

export async function updateItemStatus(
  id: string,
  status: 'JA' | 'NEIN' | '?',
  question?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const success = await updateAirtableItem(id, status, question)
    if (!success) {
      return { 
        success: false, 
        error: 'Die Aktualisierung in Airtable ist fehlgeschlagen.' 
      }
    }
    return { success: true }
  } catch (error) {
    console.error('Error in updateItemStatus:', error)
    return { 
      success: false, 
      error: 'Ein unerwarteter Fehler ist aufgetreten.' 
    }
  }
}

export async function updateItemDescription(
  itemId: string,
  description: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!description.trim()) {
      return { success: false, error: 'Beschreibung darf nicht leer sein' }
    }

    if (description.length > 10000) {
      return { success: false, error: 'Beschreibung darf maximal 10.000 Zeichen lang sein' }
    }

    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_NAME}/${itemId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            Beschreibung: description,
          },
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error?.message || 'Airtable API-Fehler' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating description:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler' 
    }
  }
}