"use client"

import React from "react"

export function ErrorFallback() {
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