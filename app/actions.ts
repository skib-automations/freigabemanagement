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