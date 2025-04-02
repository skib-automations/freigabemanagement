"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { ImageIcon, X } from "lucide-react"
import Script from 'next/script'
import { updateItemStatus } from './actions'
import { toast } from 'sonner'

interface AttachmentObject {
  id: string
  url: string
  filename?: string
  type?: string
}

interface Item {
  id: string
  title: string
  type: string
  description: string
  fields: {
    Anhang?: AttachmentObject[]
  }
  status: 'JA' | 'NEIN' | '?'
  question?: string
  attachment?: AttachmentObject
}

interface ProcessedItem {
  id: string
  approved: boolean | null
  details: {
    title: string
    type: string
    description: string
    fields: {
      Anhang?: AttachmentObject[]
    }
  }
}

// Attachment Modal Component
function AttachmentModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="mt-8 max-h-[calc(90vh-4rem)] overflow-auto">
          <img
            src={url}
            alt="Anhang"
            className="max-w-full h-auto mx-auto"
            style={{ maxHeight: 'calc(90vh - 6rem)' }}
          />
        </div>
      </div>
    </div>
  )
}

declare global {
  interface Window {
    confetti: any;
  }
}

interface Props {
  initialItems: Item[]
}

export default function FreigabeManagementClient({ initialItems }: Props) {
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [processedItems, setProcessedItems] = useState<ProcessedItem[]>([])
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showAttachmentModal, setShowAttachmentModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ProcessedItem | null>(null)
  const [question, setQuestion] = useState("")
  const [exitX, setExitX] = useState(0)
  const [exitColor, setExitColor] = useState("")
  const [isAnimating, setIsAnimating] = useState(false)
  const [isPreloaded, setIsPreloaded] = useState(false)
  const [hasShownConfetti, setHasShownConfetti] = useState(false)

  const currentItem = initialItems[currentItemIndex]
  
  // Debug logging for attachment data
  console.log('Current Item:', currentItem)
  console.log('Current Item Attachment:', currentItem?.attachment)
  
  // Updated attachment validation for single attachment object
  const hasValidAttachment = Boolean(
    currentItem?.attachment && 
    currentItem.attachment.url
  )
  
  // Debug logging for attachment validation
  console.log('hasValidAttachment:', hasValidAttachment)
  console.log('Validation details:', {
    hasAttachment: Boolean(currentItem?.attachment),
    hasUrl: Boolean(currentItem?.attachment?.url)
  })

  const isComplete = processedItems.length === initialItems.length
  const progress = Math.min(Math.round((processedItems.length / initialItems.length) * 100), 100)

  const approvedItems = useMemo(() => 
    processedItems.filter((item) => item.approved === true),
    [processedItems]
  )
  
  const rejectedItems = useMemo(() => 
    processedItems.filter((item) => item.approved === false),
    [processedItems]
  )

  // Konfetti-Animation
  const triggerConfetti = useCallback(() => {
    if (typeof window === 'undefined' || !window.confetti) return;
    
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Grünes Konfetti
      window.confetti({
        ...defaults,
        particleCount: particleCount / 2,
        colors: ['#22c55e'],
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });

      // Schwarzes Konfetti
      window.confetti({
        ...defaults,
        particleCount: particleCount / 2,
        colors: ['#000000'],
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  }, []);

  // Überprüfe, ob alle Items verarbeitet wurden
  useEffect(() => {
    if (processedItems.length === initialItems.length && !hasShownConfetti) {
      triggerConfetti();
      setHasShownConfetti(true);
    }
  }, [processedItems.length, initialItems.length, hasShownConfetti, triggerConfetti]);

  // Preload animation
  useEffect(() => {
    if (!isPreloaded) {
      const preloadAnimation = async () => {
        setIsAnimating(true)
        await new Promise(resolve => setTimeout(resolve, 50))
        setIsAnimating(false)
        setIsPreloaded(true)
      }
      preloadAnimation()
    }
  }, [isPreloaded])

  // Memoize animation variants for consistent performance
  const cardVariants = useMemo(() => ({
    initial: { 
      opacity: 1, 
      x: 0, 
      rotate: 0,
      scale: 1 
    },
    animate: { 
      opacity: isAnimating ? 0 : 1,
      x: exitX,
      rotate: isAnimating ? 15 : 0,
      scale: isAnimating ? 0.98 : 1,
      backgroundColor: exitColor || "#D9D9D9"
    },
    exit: { 
      opacity: 0, 
      x: 300, 
      rotate: 15,
      scale: 0.95
    }
  }), [isAnimating, exitX, exitColor])

  // Memoize transition configuration
  const cardTransition = useMemo(() => ({
    duration: 0.5,
    ease: [0.32, 0.72, 0, 1],
    opacity: { duration: 0.35 },
    transform: {
      duration: 0.5,
      ease: [0.32, 0.72, 0, 1]
    }
  }), [])

  const handleDecision = useCallback(async (approved: boolean) => {
    if (isAnimating || !currentItem) return

    setIsAnimating(true)
    setExitX(300)
    setExitColor(approved ? "rgba(220, 252, 231, 0.8)" : "rgba(254, 226, 226, 0.8)")

    try {
      const result = await updateItemStatus(currentItem.id, approved ? 'JA' : 'NEIN')
      
      if (!result.success) {
        toast.error(result.error || 'Fehler beim Aktualisieren des Status', {
          description: 'Bitte versuchen Sie es später erneut.',
          duration: 5000
        })
        setIsAnimating(false)
        setExitX(0)
        setExitColor("")
        return
      }

      requestAnimationFrame(() => {
        setTimeout(() => {
          const newProcessedItem: ProcessedItem = {
            id: currentItem.id,
            approved,
            details: {
              title: currentItem.title,
              type: currentItem.type,
              description: currentItem.description,
              fields: {
                Anhang: currentItem.attachment ? [currentItem.attachment] : undefined
              }
            }
          }
          setProcessedItems(prev => [...prev, newProcessedItem])
          
          if (currentItemIndex < initialItems.length - 1) {
            setCurrentItemIndex(prev => prev + 1)
          }

          requestAnimationFrame(() => {
            setIsAnimating(false)
            setExitX(0)
            setExitColor("")
          })
        }, 500)
      })
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Ein unerwarteter Fehler ist aufgetreten', {
        description: error instanceof Error ? error.message : 'Bitte versuchen Sie es später erneut.',
        duration: 5000
      })
      setIsAnimating(false)
      setExitX(0)
      setExitColor("")
    }
  }, [isAnimating, currentItem, currentItemIndex, initialItems.length])

  const handleItemClick = (item: ProcessedItem) => {
    setSelectedItem(item)
    setShowDetailModal(true)
  }

  const handleQuestionSubmit = async () => {
    if (question.trim() && !isAnimating) {
      setIsAnimating(true)
      setExitX(300)
      setExitColor("rgba(219, 234, 254, 0.8)") // Pastell-Blau

      try {
        // Update Airtable with question
        const result = await updateItemStatus(currentItem.id, '?', question)
        
        if (!result.success) {
          toast.error(result.error || 'Fehler beim Speichern der Frage', {
            description: 'Bitte versuchen Sie es später erneut.',
            duration: 5000
          })
          setIsAnimating(false)
          setExitX(0)
          setExitColor("")
          return
        }

        setTimeout(() => {
          const newProcessedItem: ProcessedItem = {
            id: currentItem.id,
            approved: null as any,
            details: {
              title: currentItem.title,
              type: currentItem.type,
              description: currentItem.description,
              fields: {
                Anhang: currentItem.attachment ? [currentItem.attachment] : undefined
              }
            }
          }
          setProcessedItems(prev => [...prev, newProcessedItem])

          if (currentItemIndex < initialItems.length - 1) {
            setCurrentItemIndex(prev => prev + 1)
          }

          // Reset states
          setQuestion("")
          setShowQuestionModal(false)
          setIsAnimating(false)
          setExitX(0)
          setExitColor("")
        }, 500)
      } catch (error) {
        console.error('Error updating item with question:', error)
        toast.error('Ein unerwarteter Fehler ist aufgetreten', {
          description: error instanceof Error ? error.message : 'Bitte versuchen Sie es später erneut.',
          duration: 5000
        })
        setIsAnimating(false)
        setExitX(0)
        setExitColor("")
      }
    }
  }

  const handleAttachmentClick = useCallback((item: Item) => {
    if (!item?.attachment?.url) {
      console.log('Invalid attachment:', item?.attachment)
      return
    }

    setSelectedItem({
      id: item.id,
      approved: null,
      details: {
        title: item.title,
        type: item.type,
        description: item.description,
        fields: {
          Anhang: [item.attachment]
        }
      }
    })
    setShowAttachmentModal(true)
  }, [])

  return (
    <>
      <div className="min-h-screen bg-[#F1F1F1] p-4 md:p-8">
        <Script 
          src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js" 
          strategy="lazyOnload"
        />

        <header className="max-w-4xl mx-auto mb-8 md:mb-16 pt-4 md:pt-8">
          <div className="flex items-center gap-2 mb-4">
            <Image
              src="/skib-logo-grey.png"
              alt="SKIB Logo"
              width={80}
              height={40}
              className="object-contain w-16 md:w-20"
              sizes="(max-width: 768px) 64px, 80px"
              priority
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">FREIGABE</h1>
          <h1 className="text-3xl md:text-4xl font-bold">MANAGEMENT</h1>
        </header>

        <main className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-8 md:mb-16 relative min-h-[400px]">
            <AnimatePresence mode="wait">
              {isComplete ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                  className="w-full max-w-2xl bg-gradient-to-b from-[#D9D9D9] to-[#d8ff56] rounded-lg border-2 border-black overflow-hidden p-4 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex items-center justify-center min-h-[350px]"
                >
                  <div className="text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">YEAAAAH!</h2>
                    <p className="text-xl md:text-2xl font-medium">
                      Du hast alle Items<br />bearbeitet.
                    </p>
                  </div>
                </motion.div>
              ) : currentItem && (
                <motion.div
                  key={currentItem.id}
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={cardTransition}
                  style={{ 
                    position: 'relative',
                    transformOrigin: "bottom left",
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden',
                    perspective: 1000,
                    willChange: 'transform, opacity'
                  }}
                  className="w-full max-w-2xl bg-[#D9D9D9] rounded-lg border-2 border-black overflow-hidden p-4 md:p-8 py-6 md:py-10 shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
                >
                  <div className="flex flex-col min-h-[350px] justify-between space-y-6 md:space-y-10">
                    <div className="space-y-6 md:space-y-8">
                      <div className="flex justify-start">
                        <div className="bg-[#d8ff56] w-16 py-1 px-2 rounded-sm flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {currentItem.type}
                          </span>
                        </div>
                      </div>
                      
                      <h2 className="text-lg md:text-xl font-bold pl-1">{currentItem.title}</h2>
                      
                      <div className="bg-white rounded-lg p-4 md:p-8">
                        <div className="text-sm md:text-base text-gray-700 min-h-[180px]">
                          {currentItem.description}
                        </div>
                      </div>

                      <div className="flex">
                        {hasValidAttachment && (
                          <button 
                            onClick={() => handleAttachmentClick(currentItem)}
                            className="bg-white rounded-lg w-12 h-12 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors hover:bg-gray-50 cursor-pointer"
                            aria-label="Anhang öffnen"
                          >
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 md:gap-4 pb-2">
                      <button
                        onClick={() => handleDecision(true)}
                        className="flex-1 bg-white border border-black rounded-full py-3 min-h-[44px] font-medium hover:bg-gray-50 transition-colors text-sm md:text-base"
                      >
                        JA
                      </button>
                      <button
                        onClick={() => handleDecision(false)}
                        className="flex-1 bg-black text-white rounded-full py-3 min-h-[44px] font-medium hover:bg-gray-900 transition-colors text-sm md:text-base"
                      >
                        NEIN
                      </button>
                      <button
                        onClick={() => setShowQuestionModal(true)}
                        className="w-16 md:w-20 min-h-[44px] flex items-center justify-center rounded-full border border-black hover:bg-gray-50 transition-colors"
                      >
                        ?
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mb-8 md:mb-16 px-2 md:px-0">
            <p className="text-lg md:text-xl mb-2">{progress}% abgearbeitet...</p>
            <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-black">
              <div 
                className="h-full bg-[#d8ff56] transition-all duration-500" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div className="bg-gray-200 rounded-lg p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-bold mb-4 text-center">Freigegeben</h2>
              <div className="space-y-2">
                {approvedItems.length > 0
                  ? approvedItems.map((item) => (
                      <motion.button
                        key={`approved-${item.id}`}
                        onClick={() => handleItemClick(item)}
                        className="w-full bg-white rounded p-2 text-center min-h-[44px] flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="text-sm md:text-base group-hover:underline">
                          ITEM
                        </span>
                      </motion.button>
                    ))
                  : Array.from({ length: 5 }).map((_, index) => (
                      <div key={`empty-approved-${index}`} className="bg-white rounded p-2 text-center min-h-[44px] flex items-center justify-center opacity-50">
                        ITEM
                      </div>
                    ))}
              </div>
            </div>
            <div className="bg-gray-200 rounded-lg p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-bold mb-4 text-center">Abgelehnt</h2>
              <div className="space-y-2">
                {rejectedItems.length > 0
                  ? rejectedItems.map((item) => (
                      <motion.button
                        key={`rejected-${item.id}`}
                        onClick={() => handleItemClick(item)}
                        className="w-full bg-white rounded p-2 text-center min-h-[44px] flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="text-sm md:text-base group-hover:underline">
                          ITEM
                        </span>
                      </motion.button>
                    ))
                  : Array.from({ length: 5 }).map((_, index) => (
                      <div key={`empty-rejected-${index}`} className="bg-white rounded p-2 text-center min-h-[44px] flex items-center justify-center opacity-50">
                        ITEM
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </main>

        {/* Frage-Modal */}
        {showQuestionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-lg p-4 md:p-6 max-w-md w-full"
            >
              <h3 className="text-lg md:text-xl font-bold mb-4">Deine Frage zum Item</h3>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 h-32 mb-4 text-base"
                placeholder="Deine Frage zum Item..."
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowQuestionModal(false)
                    setQuestion("")
                  }}
                  className="px-4 py-2 min-h-[44px] border border-gray-300 rounded-lg hover:bg-gray-100 text-sm md:text-base"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleQuestionSubmit}
                  className="px-4 py-2 min-h-[44px] bg-black text-white rounded-lg hover:bg-gray-800 text-sm md:text-base"
                >
                  Absenden
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-[#D9D9D9] rounded-lg border-2 border-black overflow-hidden max-w-2xl w-full shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
            >
              <div className="p-4 md:p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-[#d8ff56] w-16 py-1 px-2 rounded-sm flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {selectedItem.details.type}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-1 hover:bg-black/10 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <h2 className="text-lg md:text-xl font-bold mb-6">{selectedItem.details.title}</h2>
                
                <div className="bg-white rounded-lg p-4 md:p-8 mb-6">
                  <div className="text-sm md:text-base text-gray-700">
                    {selectedItem.details.description}
                  </div>
                </div>

                {selectedItem.details.fields?.Anhang && selectedItem.details.fields.Anhang.length > 0 && (
                  <div className="mb-6">
                    <button
                      onClick={() => {
                        setShowAttachmentModal(true)
                        setSelectedItem(selectedItem)
                      }}
                      className="bg-white rounded-lg px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Anhang öffnen
                    </button>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-6 py-2 bg-black text-white rounded-full min-h-[44px] font-medium hover:bg-gray-900 transition-colors text-sm md:text-base"
                  >
                    Schließen
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Attachment Modal */}
      <AnimatePresence>
        {showAttachmentModal && selectedItem?.details?.fields?.Anhang?.[0]?.url && (
          <AttachmentModal
            url={selectedItem.details.fields.Anhang[0].url}
            onClose={() => setShowAttachmentModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
} 