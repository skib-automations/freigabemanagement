"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { ImageIcon } from "lucide-react"

// Beispieldaten für das Design
const mockItems = [
  {
    id: "1",
    title: "ITEM ZUR FREIGABE",
    type: "TYPE",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliquam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit.",
  },
  {
    id: "2",
    title: "ITEM ZUR FREIGABE",
    type: "TYPE",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliquam erat.",
  },
  {
    id: "3",
    title: "ITEM ZUR FREIGABE",
    type: "TYPE",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliquam erat, sed diam voluptua.",
  },
]

export default function FreigabeManagement() {
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [processedItems, setProcessedItems] = useState<{ id: string; approved: boolean }[]>([])
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [question, setQuestion] = useState("")
  const [exitX, setExitX] = useState(0)
  const [exitColor, setExitColor] = useState("")
  const [isAnimating, setIsAnimating] = useState(false)

  const currentItem = mockItems[currentItemIndex]
  const progress = Math.round((processedItems.length / mockItems.length) * 100)

  const approvedItems = processedItems.filter((item) => item.approved)
  const rejectedItems = processedItems.filter((item) => !item.approved)

  const handleDecision = (approved: boolean) => {
    if (isAnimating) return

    setIsAnimating(true)
    setExitX(300)
    setExitColor(approved ? "rgba(220, 252, 231, 0.8)" : "rgba(254, 226, 226, 0.8)") // Pastell-Grün oder Pastell-Rot

    setTimeout(() => {
      setProcessedItems([...processedItems, { id: currentItem.id, approved }])

      if (currentItemIndex < mockItems.length - 1) {
        setCurrentItemIndex(currentItemIndex + 1)
      }

      setIsAnimating(false)
      setExitX(0)
      setExitColor("")
    }, 500)
  }

  const handleQuestionSubmit = () => {
    if (question.trim() && !isAnimating) {
      setIsAnimating(true)
      setExitX(300)
      setExitColor("rgba(219, 234, 254, 0.8)") // Pastell-Blau

      setTimeout(() => {
        // Hier würde normalerweise die Frage gespeichert werden
        setProcessedItems([...processedItems, { id: currentItem.id, approved: false }])

        if (currentItemIndex < mockItems.length - 1) {
          setCurrentItemIndex(currentItemIndex + 1)
        }

        setQuestion("")
        setShowQuestionModal(false)
        setIsAnimating(false)
        setExitX(0)
        setExitColor("")
      }, 500)
    }
  }

  return (
    <div className="min-h-screen bg-[#F1F1F1] p-8">
      <header className="max-w-4xl mx-auto mb-16 pt-8">
        <div className="flex items-center gap-2 mb-4">
          <Image
            src="/skib-logo-grey.png"
            alt="SKIB Logo"
            width={80}
            height={40}
            className="object-contain"
          />
        </div>
        <h1 className="text-4xl font-bold">FREIGABE</h1>
        <h1 className="text-4xl font-bold">MANAGEMENT</h1>
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="flex justify-center mb-16 relative min-h-[400px]">
          <AnimatePresence>
            {currentItemIndex < mockItems.length && (
              <motion.div
                key={currentItem.id}
                initial={{ opacity: 1, x: 0, rotate: 0 }}
                animate={{
                  opacity: isAnimating ? 0 : 1,
                  x: exitX,
                  rotate: isAnimating ? 15 : 0,
                  backgroundColor: exitColor || "#D9D9D9",
                }}
                exit={{ opacity: 0, x: 300, rotate: 15 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-2xl bg-[#D9D9D9] rounded-lg border-2 border-black overflow-hidden p-8 py-10 shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
                style={{ transformOrigin: "bottom left" }}
              >
                <div className="flex flex-col min-h-[350px] justify-between space-y-10">
                  <div className="space-y-8">
                    <div className="flex justify-start">
                      <div className="bg-[#d8ff56] w-16 py-1 px-2 rounded-sm flex items-center justify-center">
                        <span className="text-black text-sm font-medium">
                          {currentItem.type}
                        </span>
                      </div>
                    </div>
                    
                    <h2 className="text-xl font-bold pl-1">{currentItem.title}</h2>
                    
                    <div className="bg-white rounded-lg p-8">
                      <div className="text-sm text-gray-700 min-h-[180px]">
                        {currentItem.description}
                      </div>
                    </div>

                    <div className="flex">
                      <button 
                        onClick={() => console.log('Image clicked')} 
                        className="bg-white rounded-lg w-12 h-12 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4 pb-2">
                    <button
                      onClick={() => handleDecision(true)}
                      className="flex-1 bg-white border border-black rounded-full py-3 font-medium hover:bg-gray-50 transition-colors"
                    >
                      JA
                    </button>
                    <button
                      onClick={() => handleDecision(false)}
                      className="flex-1 bg-black text-white rounded-full py-3 font-medium hover:bg-gray-900 transition-colors"
                    >
                      NEIN
                    </button>
                    <button
                      onClick={() => setShowQuestionModal(true)}
                      className="w-20 flex items-center justify-center rounded-full border border-black hover:bg-gray-50 transition-colors py-3"
                    >
                      ?
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mb-16">
          <p className="text-xl mb-2">{progress}% abgearbeitet...</p>
          <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-black">
            <div 
              className="h-full bg-[#d8ff56] transition-all duration-500" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="bg-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-center">Freigegeben</h2>
            <div className="space-y-2">
              {approvedItems.length > 0
                ? approvedItems.map((item, index) => (
                    <div key={index} className="bg-white rounded p-2 text-center">
                      ITEM
                    </div>
                  ))
                : Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="bg-white rounded p-2 text-center">
                      ITEM
                    </div>
                  ))}
            </div>
          </div>
          <div className="bg-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-center">Abgelehnt</h2>
            <div className="space-y-2">
              {rejectedItems.length > 0
                ? rejectedItems.map((item, index) => (
                    <div key={index} className="bg-white rounded p-2 text-center">
                      ITEM
                    </div>
                  ))
                : Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="bg-white rounded p-2 text-center">
                      ITEM
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </main>

      {/* Frage-Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Deine Frage zum Item</h3>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 h-32 mb-4"
              placeholder="Deine Frage zum Item..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowQuestionModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Abbrechen
              </button>
              <button
                onClick={handleQuestionSubmit}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
              >
                Absenden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

