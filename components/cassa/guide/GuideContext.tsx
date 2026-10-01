"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { UsageGuide } from "./UsageGuide"

// Set by the login form, consumed by the first page that shows the guide.
const PENDING_KEY = "mycassa_guide_pending"
// The guide has opened on its own once on this device; from then on only the
// header button opens it.
const SEEN_KEY = "mycassa_guide_seen"
// Lets the cashier render before the guide slides in on top of it.
const AUTO_OPEN_DELAY_MS = 400

/** Called by the login form right before it redirects to the cashier. */
export function markGuidePending() {
    try {
        sessionStorage.setItem(PENDING_KEY, "1")
    } catch {
        // ignore
    }
}

interface Ctx {
    openGuide: () => void
    /** The guide is open, or may still open on its own: other dialogs wait. */
    busy: boolean
}

const GuideContext = createContext<Ctx | null>(null)

/**
 * Owns the usage guide: with `autoOpen` it opens after the first login on
 * this device, before any other dialog; the header button opens it on demand.
 */
export function GuideProvider({ children, autoOpen = false }: { children: ReactNode; autoOpen?: boolean }) {
    const [open, setOpen] = useState(false)
    // Until the first-login check has run, the guide might still open.
    const [checked, setChecked] = useState(!autoOpen)

    useEffect(() => {
        if (!autoOpen) return
        const timer = setTimeout(() => {
            try {
                const pending = sessionStorage.getItem(PENDING_KEY) === "1"
                sessionStorage.removeItem(PENDING_KEY)
                if (pending && localStorage.getItem(SEEN_KEY) !== "1") {
                    localStorage.setItem(SEEN_KEY, "1")
                    setOpen(true)
                }
            } catch {
                // ignore
            }
            setChecked(true)
        }, AUTO_OPEN_DELAY_MS)
        return () => clearTimeout(timer)
    }, [autoOpen])

    const openGuide = useCallback(() => setOpen(true), [])

    return (
        <GuideContext.Provider value={{ openGuide, busy: open || !checked }}>
            {children}
            <UsageGuide open={open} onClose={() => setOpen(false)} />
        </GuideContext.Provider>
    )
}

export function useGuide(): Ctx {
    const ctx = useContext(GuideContext)
    if (!ctx) throw new Error("useGuide must be used inside GuideProvider")
    return ctx
}
