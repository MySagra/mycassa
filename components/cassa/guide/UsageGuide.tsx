"use client"

import { useState, type ReactNode } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import {
    AddProductsIllustration,
    CancelOrderIllustration,
    CreateOrderIllustration,
    CustomerIllustration,
    DailyOrdersIllustration,
    EditItemIllustration,
    LoadOrderIllustration,
    PaymentIllustration,
    RegisterIllustration,
} from "./GuideIllustrations"

interface Step {
    title: string
    text: string
    image: ReactNode
}

// Desktop and mobile share the steps; only where the controls sit differs.
function buildSteps(mobile: boolean, t: TFunction): Step[] {
    const layout = mobile ? "Mobile" : "Desktop"
    return [
        {
            title: t("guide.addTitle"),
            text: t(`guide.add${layout}`),
            image: <AddProductsIllustration mobile={mobile} />,
        },
        {
            title: t("guide.editTitle"),
            text: t(`guide.edit${layout}`),
            image: <EditItemIllustration mobile={mobile} />,
        },
        {
            title: t("guide.customerTitle"),
            text: t("guide.customerText"),
            image: <CustomerIllustration mobile={mobile} />,
        },
        {
            title: t("guide.loadTitle"),
            text: t("guide.loadText"),
            image: <LoadOrderIllustration />,
        },
        {
            title: t("guide.paymentTitle"),
            text: t(`guide.payment${layout}`),
            image: <PaymentIllustration mobile={mobile} />,
        },
        {
            title: t("guide.createTitle"),
            text: t(`guide.create${layout}`),
            image: <CreateOrderIllustration mobile={mobile} />,
        },
        {
            title: t("guide.ordersTitle"),
            text: t(`guide.orders${layout}`),
            image: <DailyOrdersIllustration mobile={mobile} />,
        },
        {
            title: t("guide.cancelTitle"),
            text: t(`guide.cancel${layout}`),
            image: <CancelOrderIllustration mobile={mobile} />,
        },
        {
            title: t("guide.registerTitle"),
            text: t(`guide.register${layout}`),
            image: <RegisterIllustration />,
        },
    ]
}

interface Props {
    open: boolean
    onClose: () => void
}

export function UsageGuide({ open, onClose }: Props) {
    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            {/* Fixed height so the footer buttons stay put while the step text changes length. */}
            <DialogContent className="flex h-[38rem] max-h-[calc(100dvh-2rem)] flex-col sm:max-w-md">
                {/* The content unmounts on close, so every open starts from the first step. */}
                <GuideBody onClose={onClose} />
            </DialogContent>
        </Dialog>
    )
}

function GuideBody({ onClose }: { onClose: () => void }) {
    const mobile = useIsMobile()
    const { t } = useTranslation()
    const steps = buildSteps(mobile, t)
    const [index, setIndex] = useState(0)
    const step = steps[index]
    const last = index === steps.length - 1

    return (
        <>
            <DialogHeader className="text-left">
                <span className="text-xs font-medium text-muted-foreground select-none">
                    {t("guide.progress", { current: index + 1, total: steps.length })}
                </span>
                <DialogTitle className="text-lg select-none">{step.title}</DialogTitle>
            </DialogHeader>

            {/* Keyed so each step's animation starts from the beginning, and restarts
                whole when the layout switches: parts left running would lose sync with the pointer. */}
            <div key={`${index}-${mobile}`} className="animate-in fade-in-0 duration-200">
                {step.image}
            </div>

            {/* Each line of the step text is its own short paragraph. */}
            <DialogDescription asChild>
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto text-foreground/90">
                    {step.text.split("\n").map((line) => (
                        <p key={line}>{line}</p>
                    ))}
                </div>
            </DialogDescription>

            <div className="flex justify-center gap-1.5">
                {steps.map((s, i) => (
                    <button
                        key={s.title}
                        type="button"
                        aria-label={t("guide.goToStep", { step: i + 1 })}
                        onClick={() => setIndex(i)}
                        className={cn(
                            "h-2 cursor-pointer rounded-full transition-all",
                            i === index ? "w-5 bg-primary" : "w-2 bg-muted-foreground/30",
                        )}
                    />
                ))}
            </div>

            <DialogFooter className="flex-row sm:justify-between">
                {index > 0 && (
                    <Button variant="outline" className="cursor-pointer" onClick={() => setIndex(index - 1)}>
                        <ChevronLeft />
                        {t("guide.back")}
                    </Button>
                )}
                {last ? (
                    <Button className="ml-auto cursor-pointer" onClick={onClose}>
                        {t("guide.start")}
                    </Button>
                ) : (
                    <Button className="ml-auto cursor-pointer" onClick={() => setIndex(index + 1)}>
                        {t("guide.next")}
                        <ChevronRight />
                    </Button>
                )}
            </DialogFooter>
        </>
    )
}
