"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { ImageIcon, X, Pencil } from "lucide-react"
import Script from 'next/script'
import { updateItemStatus, updateItemDescription } from './actions'
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
    link?: string
  }
  status: 'JA' | 'NEIN' | '?'
  question?: string
  attachment?: AttachmentObject
  attachments: AttachmentObject[]
  kunde: string
  link?: string
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
      link?: string
    }
    link?: string
  }
}

function AttachmentModal({ attachments, onClose }: { attachments: AttachmentObject[]; onClose: () => void }) {
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0)

  const handlePrev = () => {
    setCurrentAttachmentIndex((prev) => (prev > 0 ? prev - 1 : attachments.length - 1))
  }

  const handleNext = () => {
    setCurrentAttachmentIndex((prev) => (prev < attachments.length - 1 ? prev + 1 : 0))
  }

  const currentAttachment = attachments[currentAttachmentIndex]

  console.log('AttachmentModal:', {
    attachments,
    currentAttachmentIndex,
    currentAttachment
  })

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
          {currentAttachment ? (
            <>
              <img
                src={currentAttachment.url}
                alt={`Anhang ${currentAttachmentIndex + 1}`}
                className="max-w-full h-auto mx-auto"
                style={{ maxHeight: 'calc(90vh - 6rem)' }}
              />
              {attachments.length > 1 && (
                <div className="flex justify-between mt-4">
                  <button
                    onClick={handlePrev}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Vorheriger
                  </button>
                  <span>{`${currentAttachmentIndex + 1} von ${attachments.length}`}</span>
                  <button
                    onClick={handleNext}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Nächster
                  </button>
                </div>
              )}
            </>
          ) : (
            <p>Kein Anhang verfügbar</p>
          )}
        </div>
      </div>
    </div>
  )
}

declare global {
  interface Window {
    confetti: any
  }
}

interface Props {
  initialItems: Item[]
  kunde: string
}

export default function FreigabeManagementClient({ initialItems, kunde }: Props) {
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
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedDescription, setEditedDescription] = useState("")

  const currentItem = initialItems[currentItemIndex]
  
  console.log('Current Item:', currentItem)
  console.log('Current Item Attachments:', currentItem?.attachments)
  console.log('Current Item Fields Anhang:', currentItem?.fields?.Anhang)
  
  const hasValidAttachments = Array.isArray(currentItem?.fields?.Anhang) && currentItem.fields.Anhang.length > 0
  
  console.log('hasValidAttachments:', hasValidAttachments)
  console.log('Validation details:', {
    hasAttachments: Boolean(currentItem?.fields?.Anhang),
    attachmentCount: currentItem?.fields?.Anhang?.length ?? 0,
    fieldsAnhang: currentItem?.fields?.Anhang
  })

  const isComplete = processedItems.length === initialItems.length
  const progress = initialItems.length === 0 ? 100 : Math.min(Math.round((processedItems.length / initialItems.length) * 100), 100)

  const approvedItems = useMemo(() => 
    processedItems.filter(item => item.approved === true)
  , [processedItems])

  const rejectedItems = useMemo(() => 
    processedItems.filter(item => item.approved === false)
  , [processedItems])

  const triggerConfetti = useCallback(() => {
    if (typeof window === 'undefined' || !window.confetti) return
    
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      window.confetti({
        ...defaults,
        particleCount: particleCount / 2,
        colors: ['#22c55e'],
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })

      window.confetti({
        ...defaults,
        particleCount: particleCount / 2,
        colors: ['#000000'],
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)
  }, [])

  useEffect(() => {
    if (processedItems.length === initialItems.length && !hasShownConfetti) {
      triggerConfetti()
      setHasShownConfetti(true)
    }
  }, [processedItems.length, initialItems.length, hasShownConfetti, triggerConfetti])

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

  useEffect(() => {
    if (currentItem) {
      setEditedDescription(currentItem.description)
    }
  }, [currentItem])

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
              link: currentItem.link,
              fields: {
                link: currentItem.link,
                Anhang: currentItem.fields.Anhang
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
    setIsExpanded(false)
  }

  const handleQuestionSubmit = async () => {
    if (question.trim() && !isAnimating) {
      setIsAnimating(true)
      setExitX(300)
      setExitColor("rgba(219, 234, 254, 0.8)")

      try {
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
            approved: null,
            details: {
              title: currentItem.title,
              type: currentItem.type,
              description: currentItem.description,
              link: currentItem.link,
              fields: {
                link: currentItem.link,
                Anhang: currentItem.fields.Anhang
              }
            }
          }
          setProcessedItems(prev => [...prev, newProcessedItem])

          if (currentItemIndex < initialItems.length - 1) {
            setCurrentItemIndex(prev => prev + 1)
          }

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

  const handleDescriptionSave = async () => {
    if (!editedDescription.trim()) {
      toast.error("Beschreibung darf nicht leer sein")
      return
    }

    try {
      const result = await updateItemDescription(currentItem.id, editedDescription)
      if (result.success) {
        toast.success("Beschreibung erfolgreich aktualisiert")
        setIsEditing(false)
        // Update initialItems to reflect the change
        initialItems[currentItemIndex].description = editedDescription
      } else {
        toast.error(result.error || "Fehler beim Speichern der Beschreibung")
      }
    } catch (error) {
      console.error("Error saving description:", error)
      toast.error("Ein unerwarteter Fehler ist aufgetreten", {
        description: error instanceof Error ? error.message : "Bitte versuchen Sie es später erneut.",
        duration: 5000
      })
    }
  }

  const handleDescriptionCancel = () => {
    setIsEditing(false)
    setEditedDescription(currentItem.description)
  }

  const truncateTitle = (title: string) => {
    if (title.length > 30) {
      return title.substring(0, 27) + '...'
    }
    return title
  }

  const truncateDescription = (description: string, maxLength: number = 100) => {
    if (description.length <= maxLength) return description
    return description.substring(0, maxLength).trim() + '...'
  }

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
          {kunde && (
            <div className="mt-2">
              <span className="text-sm md:text-base text-white font-bold bg-black px-2 py-1 rounded uppercase">
                {kunde}
              </span>
            </div>
          )}
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
                      
                      <div className="bg-white rounded-lg p-4 md:p-8 relative">
                        {isEditing ? (
                          <div className="relative">
                            <textarea
                              value={editedDescription}
                              onChange={(e) => setEditedDescription(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg p-3 min-h-[180px] text-sm md:text-base text-gray-700 whitespace-pre-line"
                            />
                            <button
                              onClick={handleDescriptionCancel}
                              className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                              aria-label="Bearbeitung abbrechen"
                            >
                              <X className="w-5 h-5 text-gray-600" />
                            </button>
                            {editedDescription !== currentItem.description && (
                              <div className="mt-2 flex justify-end">
                                <button
                                  onClick={handleDescriptionSave}
                                  className="px-3 py-1 bg-black text-white rounded-lg hover:bg-gray-800 text-sm"
                                >
                                  Speichern
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm md:text-base text-gray-700 min-h-[180px] whitespace-pre-line">
                            {currentItem.description}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {hasValidAttachments ? (
                          currentItem.fields.Anhang!.map((attachment, index) => (
                            <button
                              key={attachment.id}
                              onClick={() => {
                                setSelectedItem({
                                  id: currentItem.id,
                                  approved: null,
                                  details: {
                                    title: initialItems[currentItemIndex].title,
                                    type: initialItems[currentItemIndex].type,
                                    description: initialItems[currentItemIndex].description,
                                    link: initialItems[currentItemIndex].link,
                                    fields: {
                                      link: initialItems[currentItemIndex].link,
                                      Anhang: initialItems[currentItemIndex].fields.Anhang
                                    }
                                  }
                                })
                                setShowAttachmentModal(true)
                              }}
                              className="bg-white rounded-lg w-12 h-12 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors hover:bg-gray-50 cursor-pointer"
                              aria-label={`Anhang ${index + 1} öffnen`}
                              title={attachment.filename || `Anhang ${index + 1}`}
                            >
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </button>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">Keine Anhänge verfügbar</p>
                        )}
                        {currentItem.link && (
                          <a
                            href={currentItem.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white rounded-lg w-12 h-12 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors hover:bg-gray-50 cursor-pointer"
                            aria-label="Link öffnen"
                          >
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </a>
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
                      <button
                        onClick={() => {
                          setIsEditing(true)
                          setEditedDescription(currentItem.description)
                        }}
                        className="w-16 md:w-20 min-h-[44px] flex items-center justify-center rounded-full border border-black hover:bg-gray-50 transition-colors"
                        aria-label="Beschreibung bearbeiten"
                      >
                        <Pencil className="w-5 h-5" />
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
                {approvedItems.map((item) => (
                  <motion.button
                    key={`approved-${item.id}`}
                    onClick={() => handleItemClick(item)}
                    className="w-full bg-white rounded p-2 text-center min-h-[44px] flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-sm md:text-base group-hover:underline">
                      {truncateTitle(item.details.title)}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="bg-gray-200 rounded-lg p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-bold mb-4 text-center">Abgelehnt</h2>
              <div className="space-y-2">
                {rejectedItems.map((item) => (
                  <motion.button
                    key={`rejected-${item.id}`}
                    onClick={() => handleItemClick(item)}
                    className="w-full bg-white rounded p-2 text-center min-h-[44px] flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-sm md:text-base group-hover:underline">
                      {truncateTitle(item.details.title)}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          <footer className="flex justify-center mt-48 mb-8">
            <Image
              src="/skib-logo.png"
              alt="SKIB Logo"
              width={80}
              height={40}
              className="object-contain"
              sizes="80px"
              priority
            />
          </footer>
        </main>

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

        {showDetailModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-[#D9D9D9] rounded-lg border-2 border-black overflow-hidden max-w-2xl w-full max-h-[80vh] shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
            >
              <div className="p-4 md:p-8 overflow-y-auto max-h-[80vh]">
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
                  <div className="text-sm md:text-base text-gray-700 whitespace-pre-line">
                    {isExpanded
                      ? selectedItem.details.description
                      : truncateDescription(selectedItem.details.description, 100)}
                  </div>
                  {selectedItem.details.description.length > 100 && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="mt-2 text-sm text-gray-600 hover:text-gray-800 underline"
                    >
                      {isExpanded ? "Weniger anzeigen" : "Mehr anzeigen..."}
                    </button>
                  )}
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
                      Anhänge öffnen ({selectedItem.details.fields.Anhang.length})
                    </button>
                  </div>
                )}
                {selectedItem.details.link && (
                  <div className="mb-6">
                    <a
                      href={selectedItem.details.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white rounded-lg px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Link öffnen
                    </a>
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

      <AnimatePresence>
        {showAttachmentModal && selectedItem?.details?.fields?.Anhang && (
          <AttachmentModal
            attachments={selectedItem.details.fields.Anhang}
            onClose={() => setShowAttachmentModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}