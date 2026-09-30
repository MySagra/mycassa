"use client"

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type Ref, type RefObject } from "react"
import {
    ArrowLeftRight,
    Banknote,
    Calculator,
    Check,
    CheckCheck,
    CheckCircle,
    ChevronDown,
    CircleHelp,
    CreditCard,
    Delete,
    Euro,
    Eye,
    Lightbulb,
    Minus,
    MousePointer2,
    Pencil,
    Percent,
    Plus,
    Pointer,
    PrinterIcon,
    Search,
    ShoppingCart,
    Trash2,
    UserX,
    X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

// Small looping mock-ups of the cashier, drawn with the app's own tokens so
// they follow the light and dark theme. Every mock-up plays the same 5s
// timeline from globals.css: the pointer taps three times and each tap
// changes what is on screen. With reduced motion only the final state shows.
// The pointer finds what it taps by `data-tap`: the tap numbers, space separated.

type Tap = 1 | 2 | 3

// Appears after the tap.
const on: Record<Tap, string> = {
    1: "motion-safe:animate-guide-on-1",
    2: "motion-safe:animate-guide-on-2",
    3: "motion-safe:animate-guide-on-3",
}
// Replaced by the tap.
const off: Record<Tap, string> = {
    1: "motion-safe:animate-guide-off-1 motion-reduce:hidden",
    2: "motion-safe:animate-guide-off-2 motion-reduce:hidden",
    3: "motion-safe:animate-guide-off-3 motion-reduce:hidden",
}
// Gives way under the tap.
const press: Record<Tap, string> = {
    1: "motion-safe:animate-guide-press-1",
    2: "motion-safe:animate-guide-press-2",
    3: "motion-safe:animate-guide-press-3",
}

// The mock-up is drawn small and scaled up, so the text sizes stay readable
// and in proportion; phones get a smaller scale so it fits the narrow dialog.
function Frame({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div
            aria-hidden
            className="relative flex h-56 items-center justify-center overflow-hidden rounded-xl border bg-muted/40 select-none"
        >
            <div className={cn("flex scale-[1.15] items-center justify-center sm:scale-[1.35]", className)}>{children}</div>
        </div>
    )
}

// Where the tip of each pointer icon is, in its 24px box.
const MOUSE_TIP = [4, 4]
const TOUCH_TIP = [8, 2]

/** Position of `el` inside `root`, ignoring transforms (the demos move and scale things). */
function layoutOffset(el: HTMLElement, root: HTMLElement) {
    let x = 0
    let y = 0
    let node: HTMLElement | null = el
    while (node && node !== root) {
        x += node.offsetLeft
        y += node.offsetTop
        const next = node.offsetParent as HTMLElement | null
        if (next && next !== root) {
            x += next.clientLeft
            y += next.clientTop
        }
        node = next
    }
    return { x, y }
}

/**
 * The pointer: it moves to the centre of each `data-tap` target of its parent
 * in turn and presses on it; `still` lists the taps where it only rests. A tap
 * without a target keeps the pointer where the previous one left it.
 */
function Cursor({ touch, still = [] }: { touch: boolean; still?: Tap[] }) {
    const ref = useRef<SVGSVGElement>(null)
    const Icon = touch ? Pointer : MousePointer2

    // Measured after layout, and again when the text reflows (fonts, language).
    useLayoutEffect(() => {
        const icon = ref.current
        const root = icon?.parentElement
        if (!icon || !root) return
        const [tipX, tipY] = touch ? TOUCH_TIP : MOUSE_TIP
        const measure = () => {
            let spot = "0px 0px"
            for (const tap of [1, 2, 3] as const) {
                const target = root.querySelector<HTMLElement>(`[data-tap~="${tap}"]`)
                if (target) {
                    const { x, y } = layoutOffset(target, root)
                    spot = `${x + target.offsetWidth / 2 - tipX}px ${y + target.offsetHeight / 2 - tipY}px`
                }
                icon.style.setProperty(`--p${tap}`, spot)
            }
        }
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(root)
        root.querySelectorAll("[data-tap]").forEach((target) => observer.observe(target))
        return () => observer.disconnect()
    }, [touch])

    const [tipX, tipY] = touch ? TOUCH_TIP : MOUSE_TIP
    const style = {
        // The press scales around the tip, so the tip stays on the target.
        transformOrigin: `${tipX}px ${tipY}px`,
        ...Object.fromEntries(still.map((tap) => [`--press${tap}`, "1"])),
    } as CSSProperties
    return (
        <Icon
            ref={ref}
            style={style}
            className={cn(
                "pointer-events-none absolute top-0 left-0 z-20 size-6 drop-shadow motion-safe:animate-guide-cursor motion-reduce:hidden",
                touch ? "fill-background text-foreground" : "fill-foreground text-background",
            )}
        />
    )
}

/**
 * A note from the guide, not part of the app: violet (a colour the app never
 * uses), dashed and in italics, with a light bulb.
 */
function GuideNote({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <span
            className={cn(
                "inline-flex min-w-0 items-center gap-0.5 rounded-md border border-dashed border-violet-500/70 bg-violet-500/15 px-1 font-medium text-violet-700 italic dark:text-violet-300",
                className,
            )}
        >
            <Lightbulb className="size-2 shrink-0" />
            <span className="truncate">{children}</span>
        </span>
    )
}

/** Lays its children on the same spot, so one can take over from another. */
function Stack({ children, className, target }: { children: ReactNode; className?: string; target?: string }) {
    return (
        <span data-tap={target} className={cn("grid [&>*]:col-start-1 [&>*]:row-start-1", className)}>
            {children}
        </span>
    )
}

/** Shown from one tap until a later one. */
function Between({ from, to, children, className }: { from: Tap; to: Tap; children: ReactNode; className?: string }) {
    return (
        <span className={cn("block", on[from], className)}>
            <span className={cn("block h-full", off[to])}>{children}</span>
        </span>
    )
}

/** Text typed in after the tap, one character per step. */
function Typed({ text, tap, className }: { text: string; tap: 1 | 2; className?: string }) {
    return (
        <span
            className={cn("w-fit", tap === 1 ? "motion-safe:animate-guide-type-1" : "motion-safe:animate-guide-type-2", className)}
            style={{ animationTimingFunction: `steps(${text.length})` }}
        >
            {text}
        </span>
    )
}

function MiniButton({
    children,
    variant = "outline",
    className,
    target,
}: {
    children?: ReactNode
    variant?: "default" | "outline" | "destructive"
    className?: string
    target?: string
}) {
    return (
        <span
            data-tap={target}
            className={cn(
                "flex items-center justify-center gap-1 rounded-md px-1.5 py-1 text-[9px] font-medium whitespace-nowrap shadow-xs",
                variant === "default" && "bg-primary text-primary-foreground",
                variant === "outline" && "border bg-background",
                variant === "destructive" && "bg-destructive text-white",
                className,
            )}
        >
            {children}
        </span>
    )
}

/** An outline button that turns primary after the tap, like the selected payment method. */
function ToggleButton({ children, tap, className }: { children: ReactNode; tap: Tap; className?: string }) {
    return (
        <Stack target={String(tap)} className={cn(press[tap], className)}>
            <MiniButton>{children}</MiniButton>
            <MiniButton variant="default" className={cn("border border-transparent", on[tap])}>{children}</MiniButton>
        </Stack>
    )
}

/** An input box; `focus` rings it from one tap until the next. */
function MiniInput({ children, focus, className, target }: { children: ReactNode; focus?: [Tap, Tap]; className?: string; target?: string }) {
    return (
        <span data-tap={target} className={cn("relative block truncate rounded-md border bg-background px-1.5 py-1 text-[9px]", className)}>
            {focus && (
                <Between from={focus[0]} to={focus[1]} className="absolute -inset-px">
                    <span className="block size-full rounded-md ring-2 ring-primary" />
                </Between>
            )}
            {children}
        </span>
    )
}

function Toast({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <span className={cn("flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-[8px] font-medium shadow-md", className)}>
            <CheckCircle className="size-2.5 shrink-0 text-green-600" />
            {children}
        </span>
    )
}

function MiniFood({
    name,
    price,
    unavailable,
    className,
    target,
    children,
}: {
    name: string
    price: string
    unavailable?: boolean
    className?: string
    target?: string
    children?: ReactNode
}) {
    const { t } = useTranslation()
    return (
        <div data-tap={target} className={cn("relative h-11 w-[4.5rem] rounded-md border bg-card p-1.5 shadow-xs", unavailable && "opacity-50", className)}>
            <p className="truncate text-[9px] leading-3 font-semibold">{name}</p>
            <div className="mt-1 flex items-center justify-between">
                <span className="text-[9px] leading-3 font-bold text-amber-500">{price} €</span>
                {unavailable && <span className="text-[6px] font-medium text-red-500">{t("foods.notAvailable")}</span>}
            </div>
            {children}
        </div>
    )
}

function FloatingPlusOne({ tap }: { tap: 2 | 3 }) {
    // Centred by the flex row: the float animation owns `translate`.
    return (
        <span className="absolute inset-x-0 -top-2 flex justify-center motion-reduce:hidden">
            <span
                className={cn(
                    "rounded-full bg-amber-500 px-1.5 text-[9px] font-bold text-white opacity-0 shadow",
                    tap === 2 ? "motion-safe:animate-guide-float-2" : "motion-safe:animate-guide-float-3",
                )}
            >
                +1
            </span>
        </span>
    )
}

/** Cart counter going 0, 1, 2 with the second and third tap. */
function CartCount() {
    return (
        <Stack className="min-w-2 text-center font-bold text-amber-500">
            <span className={off[2]}>0</span>
            <Between from={2} to={3}>1</Between>
            <span className={on[3]}>2</span>
        </Stack>
    )
}

/** Desktop: pick a category, then click products. Mobile: tick products in the picker. */
export function AddProductsIllustration({ mobile }: { mobile: boolean }) {
    const { t } = useTranslation()

    if (mobile) {
        return (
            <Frame>
                <div className="relative flex w-48 flex-col gap-1.5">
                    <span className="flex h-6 items-center gap-1 rounded-md border bg-background px-1.5 text-[9px] text-muted-foreground">
                        <Search className="size-2.5" />
                        {t("mobile.foodPicker.title")}
                    </span>
                    <div data-tap="1" className="relative flex h-8 items-center justify-between rounded-md border bg-card px-2">
                        <span className={cn("absolute -inset-px rounded-md border border-amber-500 bg-amber-500/5", on[1])} />
                        <div className="relative">
                            <p className="text-[9px] leading-3 font-medium">{t("guide.sampleSandwich")}</p>
                            <p className="text-[8px] leading-3 font-semibold text-amber-500">6.00 €</p>
                        </div>
                        <span className={cn("relative flex items-center gap-1", on[1])}>
                            <span className="flex size-4 items-center justify-center rounded border bg-background"><Minus className="size-2" /></span>
                            <Stack className="w-2 text-center text-[9px] font-semibold">
                                <span className={off[2]}>1</span>
                                <span className={on[2]}>2</span>
                            </Stack>
                            <span data-tap="2" className={cn("flex size-4 items-center justify-center rounded border bg-background", press[2])}><Plus className="size-2" /></span>
                        </span>
                    </div>
                    <div className="flex h-8 items-center rounded-md border bg-card px-2">
                        <div>
                            <p className="text-[9px] leading-3 font-medium">{t("guide.sampleFries")}</p>
                            <p className="text-[8px] leading-3 font-semibold text-amber-500">3.50 €</p>
                        </div>
                    </div>
                    <MiniButton variant="default" target="3" className={cn("h-6 bg-amber-500 text-white", press[3])}>
                        {t("mobile.foodPicker.addButton")}
                        <Stack>
                            <Between from={1} to={2}>(1)</Between>
                            <span className={on[2]}>(2)</span>
                        </Stack>
                    </MiniButton>
                    <Cursor touch />
                </div>
            </Frame>
        )
    }

    const categories = [t("guide.sampleCatPasta"), t("guide.sampleCatGrill"), t("guide.sampleCatDrinks")]
    return (
        <Frame>
            <div className="relative flex flex-col gap-1.5">
                <div className="flex justify-end">
                    <span className="flex h-5 items-center gap-1 rounded-full border bg-background px-2 text-[8px] font-medium">
                        <ShoppingCart className="size-2.5" />
                        {t("cartSidebar.title")}
                        <CartCount />
                    </span>
                </div>
                <div className="flex gap-2">
                    <div className="flex w-14 flex-col gap-1 self-start rounded-md border bg-card p-1">
                        {categories.map((name, i) => {
                            // The first category is selected until the first tap moves the selection to the second.
                            const selected = i === 0 ? off[1] : i === 1 ? on[1] : "hidden"
                            return (
                                <span key={name} data-tap={i === 1 ? "1" : undefined} className="relative block h-4 rounded px-1 text-[8px] leading-4 font-medium">
                                    <span className={cn("absolute inset-0 rounded bg-primary", selected)} />
                                    <span className="relative block truncate">{name}</span>
                                </span>
                            )
                        })}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        <MiniFood name={t("guide.sampleSandwich")} price="6.00" target="2" className={press[2]}>
                            <FloatingPlusOne tap={2} />
                        </MiniFood>
                        <MiniFood name={t("guide.sampleSausage")} price="5.00" />
                        <MiniFood name={t("guide.sampleFries")} price="3.50" target="3" className={press[3]}>
                            <FloatingPlusOne tap={3} />
                        </MiniFood>
                        <MiniFood name={t("guide.samplePolenta")} price="2.50" unavailable />
                    </div>
                </div>
                <Cursor touch={false} />
            </div>
        </Frame>
    )
}

// The edit step is longer than the shared 5s loop, so it runs on its own
// clock: the pointer goes from one `data-target` to the next and presses it,
// and the view scrolls along with it, like the real dialog would.
interface Move {
    target: string
    /** Pause after the tap, for what it sets off (typing, a dialog opening). */
    after?: number
    /** Only points at the target, to show what the last tap changed. */
    rest?: boolean
}

const MOVE_MS = 650 // pointer travel and view scroll
const AIM_MS = 200 // rest on the target before pressing
const PRESS_MS = 160
const AFTER_MS = 550
const INTRO_MS = 500
const OUTRO_MS = 2600 // the result stays on screen after the last tap
const GAP_MS = 600 // faded out between two runs

interface DemoState {
    /** Taps done so far (rests do not count): what the mock-up shows. */
    done: number
    /** The move the pointer is on. */
    aim: number
    pressing: boolean
    pointer: boolean
    faded: boolean
}

function reducedMotion() {
    return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

const START: DemoState = { done: 0, aim: 0, pressing: false, pointer: false, faded: false }

/** Plays `moves` in a loop; with reduced motion it holds still on `still`, without the pointer. */
function useScript(moves: Move[], still: DemoState) {
    const [reduced] = useState(reducedMotion)
    const [state, setState] = useState<DemoState>(reduced ? still : START)

    useEffect(() => {
        if (reduced) return
        const timers: number[] = []
        const at = (ms: number, change: Partial<DemoState>) =>
            timers.push(window.setTimeout(() => setState((s) => ({ ...s, ...change })), ms))

        const run = () => {
            let t = INTRO_MS
            at(t, { pointer: true })
            t += 300
            let taps = 0
            moves.forEach((move, i) => {
                if (i > 0) {
                    at(t, { aim: i })
                    t += MOVE_MS
                }
                if (!move.rest) {
                    t += AIM_MS
                    at(t, { pressing: true })
                    // What the tap does shows halfway through the press.
                    at(t + PRESS_MS / 2, { done: ++taps })
                    at(t + PRESS_MS, { pressing: false })
                    t += PRESS_MS
                }
                if (i < moves.length - 1) t += move.after ?? AFTER_MS
            })
            at(t + 900, { pointer: false })
            t += OUTRO_MS
            at(t, { faded: true })
            timers.push(
                window.setTimeout(() => {
                    setState(START)
                    run()
                }, t + GAP_MS),
            )
        }
        run()
        return () => timers.forEach(clearTimeout)
    }, [moves, reduced])

    return state
}

const slides = new WeakMap<Element, Animation>()

/**
 * Slides `el` to the `translate` value `to`, from wherever it is now, even
 * halfway through a previous slide; `jump` moves it at once.
 */
function slide(el: HTMLElement | SVGSVGElement, to: string, jump: boolean) {
    if (el.dataset.slideTo === to) return
    el.dataset.slideTo = to
    // Read before the change: mid-slide this is where the previous slide got to.
    const from = getComputedStyle(el).translate
    slides.get(el)?.cancel()
    el.style.translate = to
    if (!jump) slides.set(el, el.animate({ translate: [from, to] }, { duration: MOVE_MS, easing: "ease-in-out" }))
}

/**
 * Keeps the scripted pointer on the `data-target` named `target` inside the
 * scene. With a `view`, the scene also scrolls to keep the target in sight
 * while `scroll` is on. `layout` re-measures when what it shows changes.
 */
function useFollow(
    refs: {
        scene: RefObject<HTMLDivElement | null>
        pointer: RefObject<SVGSVGElement | null>
        view?: RefObject<HTMLDivElement | null>
    },
    target: string,
    touch: boolean,
    scroll: boolean,
    layout: unknown,
) {
    // What the last placement followed: a new aim slides, the same aim follows the layout at once.
    const lastRef = useRef<string | null>(null)
    const { scene: sceneRef, pointer: pointerRef, view: viewRef } = refs

    useLayoutEffect(() => {
        const scene = sceneRef.current
        const pointer = pointerRef.current
        const view = viewRef?.current
        if (!scene || !pointer) return
        const [tipX, tipY] = touch ? TOUCH_TIP : MOUSE_TIP
        const place = () => {
            const el = scene.querySelector<HTMLElement>(`[data-target="${target}"]`)
            // A target closing up under the pointer (a badge just picked) is not followed.
            if (!el || el.closest("[data-closed]")) return
            const { x, y } = layoutOffset(el, scene)
            const centreY = y + el.offsetHeight / 2
            const room = view ? Math.max(0, scene.offsetHeight - view.clientHeight) : 0
            const top = view && scroll ? Math.min(room, Math.max(0, centreY - view.clientHeight / 2)) : 0
            // The first placement jumps there, the pointer is not shown yet. When the
            // layout moves under the same target (a row opening above it), the pointer
            // and the view follow at once, so the target does not slip away.
            const key = `${target}:${scroll}`
            const jump = lastRef.current === null || lastRef.current === key || reducedMotion()
            lastRef.current = key
            slide(pointer, `${x + el.offsetWidth / 2 - tipX}px ${centreY - tipY}px`, jump)
            if (view) slide(scene, `0px ${-top}px`, jump)
        }
        place()
        const observer = new ResizeObserver(place)
        observer.observe(scene)
        return () => observer.disconnect()
    }, [sceneRef, pointerRef, viewRef, target, touch, scroll, layout])
}

/** The pointer of a scripted demo; `useFollow` moves it. */
function ScriptPointer({ ref, touch, state }: { ref: Ref<SVGSVGElement>; touch: boolean; state: DemoState }) {
    const Icon = touch ? Pointer : MousePointer2
    const [tipX, tipY] = touch ? TOUCH_TIP : MOUSE_TIP
    return (
        <Icon
            ref={ref}
            style={{
                transformOrigin: `${tipX}px ${tipY}px`,
                transition: "scale 120ms ease-out, opacity 300ms",
                scale: state.pressing ? 0.8 : 1,
                opacity: state.pointer ? 1 : 0,
            }}
            className={cn(
                "pointer-events-none absolute top-0 left-0 z-30 size-6 drop-shadow",
                touch ? "fill-background text-foreground" : "fill-foreground text-background",
            )}
        />
    )
}

/** Scales the aimed target down while the scripted pointer presses it. */
function pressOf(state: DemoState, moves: Move[]) {
    const aimed = moves[state.aim].target
    return (target: string) => cn("transition-[scale] duration-100", state.pressing && aimed === target && "scale-[0.92]")
}

// The visible part of the scrolling mock-up: the frame height, before the frame scales it up.
const VIEW_H = "h-[calc(14rem/1.15)] sm:h-[calc(14rem/1.35)]"

const DESKTOP_EDIT: Move[] = [
    { target: "plus" },
    { target: "pencil", after: 700 },
    { target: "onion-minus" },
    { target: "extras", after: 700 },
    { target: "cheese", after: 500 },
    { target: "cheese-row", rest: true, after: 700 },
    { target: "note", after: 1300 },
    { target: "save" },
]
// On phones the extras are searched: the tap on the search box types in it.
const MOBILE_EDIT: Move[] = [
    { target: "plus" },
    { target: "pencil", after: 700 },
    { target: "onion-minus" },
    { target: "extras", after: 1200 },
    { target: "cheese", after: 500 },
    { target: "cheese-row", rest: true, after: 700 },
    { target: "note", after: 1300 },
    { target: "save" },
]
// Everything set and not saved yet, seen from the extras.
const EDIT_STILL: DemoState = { ...START, done: 6, aim: 3 }

/** Text typed in once, as soon as it shows. */
function TypedOnce({ text, className }: { text: string; className?: string }) {
    return (
        <span
            className={cn("inline-block w-fit whitespace-nowrap motion-safe:animate-guide-type-once", className)}
            style={{ animationTimingFunction: `steps(${text.length})` }}
        >
            {text}
        </span>
    )
}

/** Opens its content smoothly, like the accordion. */
function Expand({ open, children, className }: { open: boolean; children: ReactNode; className?: string }) {
    return (
        <div
            data-closed={open ? undefined : ""}
            className={cn("grid transition-[grid-template-rows,opacity] duration-200", open ? "grid-rows-[1fr]" : "grid-rows-[0fr] opacity-0", className)}
        >
            <div className="min-h-0 overflow-hidden">{children}</div>
        </div>
    )
}

function IconBox({ children, className, target }: { children: ReactNode; className?: string; target?: string }) {
    return (
        <span data-target={target} className={cn("flex size-4 shrink-0 items-center justify-center rounded-md border bg-background shadow-xs", className)}>
            {children}
        </span>
    )
}

function FieldLabel({ children, className }: { children: ReactNode; className?: string }) {
    return <span className={cn("text-[8.5px] leading-none font-medium", className)}>{children}</span>
}

function Hint({ children, className }: { children: ReactNode; className?: string }) {
    return <span className={cn("text-[7px] leading-tight text-muted-foreground", className)}>{children}</span>
}

/** A cart row as CartItem draws it. */
function CartRow({
    qty,
    price,
    mods = [],
    note,
    surcharge,
    targets,
    press,
    className,
    pencilTarget,
}: {
    qty: number
    price: string
    mods?: string[]
    note?: string
    surcharge?: string
    targets?: boolean
    press: (target: string) => string
    className?: string
    /** `data-target` for the pencil when the row is not the one being edited. */
    pencilTarget?: string
}) {
    const { t } = useTranslation()
    return (
        <div className={cn("w-52 rounded-lg border bg-card p-2", className)}>
            <div className="mb-1.5 flex items-start justify-between gap-1">
                <div className="min-w-0">
                    <p className="text-[10px] font-medium">{t("guide.sampleSandwich")}</p>
                    {mods.map((mod) => (
                        <p key={mod} className="text-[8px] text-amber-600 dark:text-amber-500">{mod}</p>
                    ))}
                    {note && <p className="text-[8px] text-muted-foreground">{note}</p>}
                </div>
                <div className="flex items-center gap-0.5">
                    <span data-target={targets ? "pencil" : pencilTarget} className={cn("flex size-5 items-center justify-center rounded-md", targets && press("pencil"))}>
                        <Pencil className="size-3" />
                    </span>
                    <span className="flex size-5 items-center justify-center rounded-md text-destructive"><X className="size-3" /></span>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <IconBox className="size-5"><Minus className="size-2.5" /></IconBox>
                    <span className="w-3 text-center text-[10px] font-medium">{qty}</span>
                    <IconBox target={targets ? "plus" : undefined} className={cn("size-5", targets && press("plus"))}><Plus className="size-2.5" /></IconBox>
                </div>
                <div className="text-right">
                    {surcharge && <p className="text-[7px] text-amber-600 dark:text-amber-500">{surcharge}</p>}
                    <p className="text-[11px] font-bold">{price}</p>
                </div>
            </div>
        </div>
    )
}

/** An ingredient line of the editor, with its − and + buttons. */
function IngredientLine({
    name,
    qty,
    extra,
    minusTarget,
    nameTarget,
    press,
    mobile,
}: {
    name: string
    qty: number
    extra?: boolean
    minusTarget?: string
    nameTarget?: string
    press: (target: string) => string
    mobile: boolean
}) {
    return (
        <div className={cn("flex items-center justify-between", mobile && "px-2 py-1")}>
            <span data-target={nameTarget} className={cn("text-[8.5px] font-medium", extra && "text-amber-500")}>{name}</span>
            <div className="flex items-center gap-1">
                <IconBox target={minusTarget} className={cn(mobile && "size-5", minusTarget && press(minusTarget))}><Minus className="size-2.5" /></IconBox>
                <span className="w-3 text-center text-[8.5px] font-semibold">{qty}</span>
                <IconBox className={cn(mobile && "size-5")}><Plus className="size-2.5" /></IconBox>
            </div>
        </div>
    )
}

/**
 * The cart row's pencil opens Modifica Prodotto (a dialog, a drawer on
 * phones): one onion less, cheese added, a note, then Salva splits the row.
 */
export function EditItemIllustration({ mobile }: { mobile: boolean }) {
    const { t } = useTranslation()
    const moves = mobile ? MOBILE_EDIT : DESKTOP_EDIT
    const state = useScript(moves, EDIT_STILL)
    const viewRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<HTMLDivElement>(null)
    const pointerRef = useRef<SVGSVGElement>(null)

    const { done } = state
    const open = done >= 2 && done < 7
    const onion = done >= 3 ? 0 : 1
    const extrasOpen = done >= 4
    const cheese = done >= 5
    const noted = done >= 6
    const saved = done >= 7
    const press = pressOf(state, moves)
    // Once saved, the pointer shows the new row before it fades out.
    useFollow({ scene: sceneRef, pointer: pointerRef, view: viewRef }, saved ? "result" : moves[state.aim].target, mobile, open, done)

    const badges = [t("guide.sampleCheese"), t("guide.sampleBacon"), t("guide.sampleEgg"), t("guide.sampleMushrooms")]
    const search = t("guide.sampleCheese").slice(0, 4).toLowerCase()

    const ingredients = (
        <>
            <IngredientLine name={t("guide.sampleOnion")} qty={onion} minusTarget="onion-minus" press={press} mobile={mobile} />
            <IngredientLine name={t("guide.sampleSauce")} qty={1} press={press} mobile={mobile} />
            <Expand open={cheese}>
                <div className={cn(mobile ? "border-t" : "mt-1.5 border-t pt-1.5")}>
                    <IngredientLine name={t("guide.sampleCheese")} qty={1} extra nameTarget="cheese-row" press={press} mobile={mobile} />
                </div>
            </Expand>
        </>
    )
    const note = (
        <div className="flex flex-col gap-1">
            <FieldLabel>{t("editItemDialog.note")}</FieldLabel>
            <div
                data-target="note"
                className={cn(
                    "rounded-md border px-1.5 py-1 text-[8px] transition-shadow",
                    mobile ? "h-8" : "h-10",
                    noted && !saved && "ring-2 ring-ring/50",
                    press("note"),
                )}
            >
                {noted ? <TypedOnce text={t("guide.sampleNote")} /> : <span className="text-muted-foreground">{t("editItemDialog.notePlaceholder")}</span>}
            </div>
        </div>
    )
    const cancel = t("editItemDialog.cancel")
    const save = t("editItemDialog.save")

    const sheet = mobile ? (
        // MobileEditItemDrawer: a sheet from the bottom, the extras found by search.
        <div className="flex w-56 flex-col rounded-t-xl border bg-background shadow-lg">
            <div className="mx-auto mt-1.5 h-1 w-10 rounded-full bg-muted" />
            <div className="flex flex-col gap-0.5 px-3 pt-2 pb-1.5 text-center">
                <span className="text-[11px] font-semibold">{t("editItemDialog.title")}</span>
                <span className="text-[8px] text-muted-foreground">{t("guide.sampleSandwich")}</span>
            </div>
            <div className="flex flex-col gap-2.5 px-3 pb-2">
                <div className="flex flex-col gap-1">
                    <FieldLabel>{t("editItemDialog.quantityPrompt")}</FieldLabel>
                    <div className="flex items-center gap-2">
                        <IconBox className="size-6"><Minus className="size-3" /></IconBox>
                        <span className="flex-1 text-center text-sm font-bold">1</span>
                        <IconBox className="size-6"><Plus className="size-3" /></IconBox>
                    </div>
                    <Hint className="text-center">{t("editItemDialog.quantityHint", { max: 2 })}</Hint>
                </div>
                <div className="flex flex-col gap-1">
                    <FieldLabel>{t("editItemDialog.ingredients")}</FieldLabel>
                    <div className="divide-y rounded-lg border">{ingredients}</div>
                    <Hint>{t("editItemDialog.ingredientsHint")}</Hint>
                </div>
                <div className="flex flex-col gap-1">
                    <FieldLabel>{t("editItemDialog.addIngredients")}</FieldLabel>
                    <div
                        data-target="extras"
                        className={cn("flex h-5 items-center gap-1 rounded-md border px-1.5 text-[8px]", done === 4 && "ring-2 ring-ring/50", press("extras"))}
                    >
                        <Search className="size-2.5 shrink-0 text-muted-foreground" />
                        {done === 4 ? <TypedOnce text={search} /> : <span className="text-muted-foreground">{t("editItemDialog.searchPlaceholder")}</span>}
                    </div>
                    <Expand open={done === 4}>
                        <div className="flex pt-1">
                            <span data-target="cheese" className={cn("rounded-md border px-2 py-0.5 text-[8px] font-medium", press("cheese"))}>
                                {t("guide.sampleCheese")}
                            </span>
                        </div>
                    </Expand>
                </div>
                {note}
            </div>
            <div className="flex gap-2 border-t p-2">
                <MiniButton className="h-6 flex-1">{cancel}</MiniButton>
                <span data-target="save" className={cn("flex flex-1", press("save"))}>
                    <MiniButton className="h-6 flex-1 bg-amber-500 text-primary-foreground">{save}</MiniButton>
                </span>
            </div>
        </div>
    ) : (
        // EditItemDialog: the extras in an accordion of badges.
        <div className="relative flex w-56 flex-col gap-2.5 rounded-lg border bg-background p-3 shadow-lg">
            <X className="absolute top-2.5 right-2.5 size-2.5 opacity-70" />
            <div className="flex flex-col gap-1">
                <span className="text-[11px] leading-none font-semibold">{t("editItemDialog.title")}</span>
                <span className="text-[8px] text-muted-foreground">{t("guide.sampleSandwich")}</span>
            </div>
            <div className="flex flex-col gap-1">
                <FieldLabel>{t("editItemDialog.quantityPrompt")}</FieldLabel>
                <div className="flex items-center gap-1">
                    <IconBox className="size-5"><Minus className="size-2.5" /></IconBox>
                    <span className="flex h-5 w-10 items-center justify-center rounded-md border text-[9px]">1</span>
                    <IconBox className="size-5"><Plus className="size-2.5" /></IconBox>
                </div>
                <Hint>{t("editItemDialog.quantityHint", { max: 2 })}</Hint>
            </div>
            <div className="flex flex-col gap-1">
                <FieldLabel>{t("editItemDialog.ingredients")}</FieldLabel>
                <div className="flex flex-col gap-1.5 rounded-md border p-1.5">{ingredients}</div>
                <Hint>{t("editItemDialog.ingredientsHint")}</Hint>
            </div>
            <div className="rounded-md border px-2 py-1">
                <div className="flex h-5 items-center gap-1.5">
                    <span data-target="extras" className={cn("shrink-0", press("extras"))}>
                        <FieldLabel>{t("editItemDialog.addIngredients")}</FieldLabel>
                    </span>
                    <span className={cn("flex h-4 min-w-0 flex-1 items-center gap-1 rounded-md border px-1 text-[7px] text-muted-foreground transition-opacity", !extrasOpen && "opacity-0")}>
                        <Search className="size-2 shrink-0" />
                        {t("editItemDialog.searchPlaceholder")}
                    </span>
                    <ChevronDown className={cn("size-3 shrink-0 text-muted-foreground transition-transform duration-200", extrasOpen && "rotate-180")} />
                </div>
                <Expand open={extrasOpen}>
                    <div className="flex flex-wrap gap-1 pt-1 pb-1">
                        {badges.map((name, i) => (
                            <span
                                key={name}
                                data-target={i === 0 ? "cheese" : undefined}
                                className={cn(
                                    "rounded-md border px-1.5 py-px text-[8px] font-medium transition-colors",
                                    i === 0 && cheese && "border-transparent bg-primary text-primary-foreground",
                                    i === 0 && press("cheese"),
                                )}
                            >
                                {name}
                            </span>
                        ))}
                    </div>
                </Expand>
            </div>
            {note}
            <div className="flex justify-end gap-1.5">
                <MiniButton>{cancel}</MiniButton>
                <span data-target="save" className={cn("flex", press("save"))}>
                    <MiniButton className="bg-amber-500 text-primary-foreground">{save}</MiniButton>
                </span>
            </div>
        </div>
    )

    return (
        <Frame>
            <div ref={viewRef} className={cn("relative w-60", VIEW_H)}>
                <div
                    ref={sceneRef}
                    className={cn(
                        "relative grid transition-opacity duration-500 [&>*]:col-start-1 [&>*]:row-start-1",
                        state.faded && "opacity-0",
                    )}
                >
                    {/* The cart, centred in the view. */}
                    <div className={cn("flex flex-col items-center justify-center gap-1.5", VIEW_H)}>
                        {saved ? (
                            <>
                                <CartRow qty={1} price="6.00 €" press={press} />
                                <CartRow
                                    qty={1}
                                    price="6.50 €"
                                    mods={[`NO ${t("guide.sampleOnion")}`, `+${t("guide.sampleCheese")}`]}
                                    note={t("guide.sampleNote")}
                                    surcharge="(+0.50€)"
                                    press={press}
                                    pencilTarget="result"
                                    className="motion-safe:animate-guide-flash"
                                />
                            </>
                        ) : (
                            <CartRow qty={done >= 1 ? 2 : 1} price={done >= 1 ? "12.00 €" : "6.00 €"} targets press={press} />
                        )}
                    </div>
                    {/* The overlay dims the whole frame, not just the scene. */}
                    <div className={cn("pointer-events-none absolute -inset-[20rem] z-10 bg-black/50 transition-opacity duration-200", !open && "opacity-0")} />
                    <div
                        className={cn(
                            "z-20 self-start justify-self-center transition-[opacity,scale,translate] duration-200",
                            mobile ? "mt-5" : "mt-2",
                            !open && (mobile ? "translate-y-8 opacity-0" : "scale-95 opacity-0"),
                        )}
                    >
                        {sheet}
                    </div>
                    <ScriptPointer ref={pointerRef} touch={mobile} state={state} />
                </div>
            </div>
        </Frame>
    )
}

const CUSTOMER_DESKTOP: Move[] = [
    { target: "customer", after: 1200 },
    { target: "table", after: 1000 },
    // Next customer, no name given: the form starts empty and the pointer
    // hovers the default button long enough to read its tooltip.
    { target: "no-customer", rest: true, after: 1100 },
    { target: "no-customer" },
]
// No hover on phones: the finger goes straight to the button.
const CUSTOMER_MOBILE: Move[] = [
    { target: "customer", after: 1200 },
    { target: "table", after: 1000 },
    { target: "no-customer", rest: true, after: 150 },
    { target: "no-customer" },
]
// Name and table typed in.
const CUSTOMER_STILL: DemoState = { ...START, done: 2, aim: 1 }

/**
 * The order form, twice: a customer who gives a name and table, then one who
 * does not, filled in by the default customer button.
 */
export function CustomerIllustration({ mobile }: { mobile: boolean }) {
    const { t } = useTranslation()
    const moves = mobile ? CUSTOMER_MOBILE : CUSTOMER_DESKTOP
    const state = useScript(moves, CUSTOMER_STILL)
    const sceneRef = useRef<HTMLDivElement>(null)
    const pointerRef = useRef<SVGSVGElement>(null)
    const press = pressOf(state, moves)
    const { done } = state
    // From the third move on, it is the customer without a name.
    const anonymous = state.aim >= 2
    const defaulted = done >= 3
    useFollow({ scene: sceneRef, pointer: pointerRef }, moves[state.aim].target, mobile, false, anonymous)

    const field = (typed: ReactNode, placeholder: string, focused: boolean, target: string) => (
        <span
            data-target={target}
            className={cn(
                "relative block truncate rounded-md border bg-background px-1.5 py-1 text-[9px] transition-shadow",
                focused && "ring-2 ring-ring/50",
                defaulted && "motion-safe:animate-guide-flash",
            )}
        >
            {typed || <span className="text-muted-foreground">{placeholder}</span>}
        </span>
    )

    return (
        <Frame>
            <div ref={sceneRef} className={cn("relative flex w-52 flex-col gap-1.5 transition-opacity duration-500", state.faded && "opacity-0")}>
                {/* Which customer this is. */}
                <GuideNote key={String(anonymous)} className="self-center py-0.5 text-[8px] animate-in fade-in-0 duration-300">
                    {anonymous ? t("guide.customerAnonymous") : t("guide.customerNamed")}
                </GuideNote>
                <div className="flex flex-col gap-2 rounded-lg border bg-card p-2 shadow-sm">
                    <div>
                        <p className="mb-0.5 text-[8px] font-medium">{t("orderForm.loadOrder")}</p>
                        <div className="relative flex gap-1">
                            <div className="flex flex-1">
                                <span className="flex-1 truncate rounded-l-md border bg-background px-1.5 py-1 text-[8px] text-muted-foreground">
                                    {t("orderForm.orderCodePlaceholder")}
                                </span>
                                <MiniButton variant="default" className="rounded-l-none"><Search className="size-2.5" /></MiniButton>
                            </div>
                            <span data-target="no-customer" className={cn("flex", press("no-customer"))}>
                                <MiniButton><UserX className="size-2.5" /></MiniButton>
                            </span>
                            {/* The button's tooltip, once the pointer has got there. */}
                            {!mobile && (
                                <span
                                    className={cn(
                                        "absolute right-0 bottom-full mb-1 rounded-md bg-foreground px-1.5 py-0.5 text-[8px] whitespace-nowrap text-background shadow transition-opacity duration-200",
                                        anonymous && !defaulted ? "opacity-100 delay-700" : "opacity-0",
                                    )}
                                >
                                    {t("orderForm.noCustomer")}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="min-w-0">
                            <p className="mb-0.5 text-[8px] font-medium">{t("orderForm.customer")} *</p>
                            {field(
                                anonymous
                                    ? defaulted && <span className="animate-in fade-in-0">NO_CUSTOMER</span>
                                    : done >= 1 && <TypedOnce text={t("guide.sampleCustomer")} />,
                                t("orderForm.customerPlaceholder"),
                                !anonymous && done === 1,
                                "customer",
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="mb-0.5 text-[8px] font-medium">{t("orderForm.table")} *</p>
                            {field(
                                anonymous
                                    ? defaulted && <span className="animate-in fade-in-0">NO_TABLE</span>
                                    : done >= 2 && <TypedOnce text="12" />,
                                t("guide.sampleTablePlaceholder"),
                                !anonymous && done === 2,
                                "table",
                            )}
                        </div>
                    </div>
                </div>
                <ScriptPointer ref={pointerRef} touch={mobile} state={state} />
            </div>
        </Frame>
    )
}

/** A three-letter code typed in Carica Ordine fills the cart. */
export function LoadOrderIllustration() {
    const { t } = useTranslation()
    return (
        <Frame>
            <div className="relative flex w-52 flex-col gap-1.5">
                <Toast className={cn("self-center", on[2])}>{t("toast.orderLoaded", { displayCode: "ABC" })}</Toast>
                <div className="flex">
                    <MiniInput focus={[1, 2]} target="1" className="flex-1 rounded-r-none">
                        <Stack>
                            <span className={cn("truncate text-[8px] text-muted-foreground", off[1])}>{t("orderForm.orderCodePlaceholder")}</span>
                            <Typed text="ABC" tap={1} className="font-mono font-semibold" />
                        </Stack>
                    </MiniInput>
                    <MiniButton variant="default" target="2" className={cn("rounded-l-none", press[2])}><Search className="size-2.5" /></MiniButton>
                </div>
                <MiniInput className={on[2]}>{t("guide.sampleCustomer")}</MiniInput>
                <div className={cn("flex flex-col gap-1", on[2])}>
                    {[`2× ${t("guide.sampleSandwich")}`, `1× ${t("guide.sampleFries")}`].map((label, i) => (
                        <span key={label} className="flex items-center justify-between rounded-md border bg-card px-2 py-1 text-[9px] font-medium">
                            {label}
                            <span className="font-bold">{i === 0 ? "12.00" : "3.50"} €</span>
                        </span>
                    ))}
                </div>
                <Cursor touch={false} still={[3]} />
            </div>
        </Frame>
    )
}

const PAY_DESKTOP: Move[] = [
    { target: "percent", after: 700 },
    { target: "discount-input", after: 1000 },
    { target: "apply", after: 500 },
    // Points at the new total while the toast is up.
    { target: "total", rest: true, after: 1000 },
    { target: "cash", after: 700 },
    { target: "paid", after: 1100 },
    { target: "change", rest: true },
]
// On phones the change comes from the calculator.
const PAY_MOBILE: Move[] = [
    { target: "percent", after: 700 },
    { target: "discount-input", after: 1000 },
    { target: "apply", after: 500 },
    { target: "total", rest: true, after: 1000 },
    { target: "cash", after: 500 },
    { target: "calculator", after: 700 },
    { target: "preset", after: 500 },
    { target: "change", rest: true },
]
// Discount applied, cash given, change shown.
const PAY_STILL_DESKTOP: DemoState = { ...START, done: 5, aim: 6 }
const PAY_STILL_MOBILE: DemoState = { ...START, done: 6, aim: 7 }

const VIEW_MIN_H = "min-h-[calc(14rem/1.15)] sm:min-h-[calc(14rem/1.35)]"

/** A money input, right aligned with the euro sign inside, as in the app. */
function MoneyInput({ target, typed, focused, press }: { target: string; typed: string | false; focused: boolean; press: (target: string) => string }) {
    return (
        <span
            data-target={target}
            className={cn(
                "relative flex h-5 items-center justify-end rounded-md border bg-background pr-4 pl-1.5 text-[9px] transition-shadow",
                focused && "ring-2 ring-ring/50",
                press(target),
            )}
        >
            {typed ? <TypedOnce text={typed} /> : <span className="text-muted-foreground">0.00</span>}
            <span className="absolute right-1.5 text-muted-foreground">€</span>
        </span>
    )
}

/**
 * The payment part of the cart: the % button opens Applica Sconto, then cash
 * is picked and the change worked out (by the calculator on phones).
 */
export function PaymentIllustration({ mobile }: { mobile: boolean }) {
    const { t } = useTranslation()
    const moves = mobile ? PAY_MOBILE : PAY_DESKTOP
    const state = useScript(moves, mobile ? PAY_STILL_MOBILE : PAY_STILL_DESKTOP)
    const viewRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<HTMLDivElement>(null)
    const pointerRef = useRef<SVGSVGElement>(null)
    const press = pressOf(state, moves)

    const { done } = state
    const discountOpen = done === 1 || done === 2
    const discounted = done >= 3
    const toast = discounted && state.aim <= 3
    const cash = done >= 4
    const paid = !mobile && done >= 5
    const changed = !mobile && state.aim >= 6
    const calculatorOpen = mobile && done >= 5
    const picked = mobile && done >= 6
    const total = discounted ? "13.50" : "15.50"
    useFollow({ scene: sceneRef, pointer: pointerRef, view: viewRef }, moves[state.aim].target, mobile, !mobile || calculatorOpen, done)

    const discountDialog = (
        // DiscountDialog; below sm its footer stacks, Applica Sconto on top.
        <div className="relative flex w-52 flex-col gap-2.5 rounded-lg border bg-background p-3 shadow-lg">
            <X className="absolute top-2.5 right-2.5 size-2.5 opacity-70" />
            <div className="flex flex-col gap-1 pr-3">
                <span className="text-[11px] leading-none font-semibold">{t("discountDialog.title")}</span>
                <span className="text-[8px] leading-tight text-muted-foreground">{t("discountDialog.description")}</span>
            </div>
            <div className="flex flex-col gap-1 py-1">
                <FieldLabel>{t("discountDialog.discountLabel")}</FieldLabel>
                <MoneyInput target="discount-input" typed={done >= 2 && "2.00"} focused={done === 2} press={press} />
                <Hint>{t("discountDialog.maxDiscount")}</Hint>
            </div>
            <div className={cn("flex gap-1.5", mobile ? "flex-col-reverse" : "justify-end")}>
                <MiniButton variant="destructive">{t("discountDialog.removeDiscount")}</MiniButton>
                <span data-target="apply" className={cn("flex", press("apply"))}>
                    <MiniButton className="flex-1 bg-amber-500 text-primary-foreground">{t("discountDialog.apply")}</MiniButton>
                </span>
            </div>
        </div>
    )

    const calculator = (
        // MobileChangeCalculatorDrawer, numpad included.
        <div className="flex w-56 flex-col rounded-t-xl border bg-background shadow-lg">
            <div className="mx-auto mt-1.5 h-1 w-10 rounded-full bg-muted" />
            <span className="px-3 pt-2 pb-1.5 text-center text-[11px] font-semibold">{t("mobile.changeCalculator.title")}</span>
            <div className="flex flex-col gap-2 px-3 pb-3">
                <div className="flex items-center justify-between text-[8px] text-muted-foreground">
                    <span>{t("mobile.changeCalculator.totalLabel")}</span>
                    <span className="font-semibold text-foreground">13.50 €</span>
                </div>
                <div className="flex min-h-7 items-center justify-end rounded-lg border bg-muted/30 px-2">
                    {picked ? (
                        <span className="text-base font-bold animate-in fade-in-0">20 €</span>
                    ) : (
                        <span className="text-[11px] text-muted-foreground">0.00 €</span>
                    )}
                </div>
                <div data-target="change" className="flex items-center justify-between">
                    <span className="text-[9px] font-medium">{t("payment.change")}</span>
                    <span className={cn("text-sm font-bold", picked ? "text-green-600 dark:text-green-500" : "text-muted-foreground")}>
                        {picked ? "6.50 €" : "— €"}
                    </span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                    {[14, 15, 20, 50, 100].map((note) => (
                        <span key={note} data-target={note === 20 ? "preset" : undefined} className={cn("flex", note === 20 && press("preset"))}>
                            <MiniButton
                                variant={picked && note === 20 ? "default" : "outline"}
                                className="flex-1 border border-transparent px-0 font-semibold"
                            >
                                {note}€
                            </MiniButton>
                        </span>
                    ))}
                </div>
                <div className="grid grid-cols-3 gap-1">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"].map((key) => (
                        <MiniButton key={key} className="h-4 font-semibold">{key}</MiniButton>
                    ))}
                    <MiniButton className="h-4"><Delete className="size-2.5" /></MiniButton>
                </div>
                <div className="flex gap-2">
                    <MiniButton className="h-6 flex-1">{t("cartSidebar.cancel")}</MiniButton>
                    <MiniButton className={cn("h-6 flex-1 bg-amber-500 text-primary-foreground transition-opacity", !picked && "opacity-50")}>
                        {t("mobile.changeCalculator.applyButton")}
                    </MiniButton>
                </div>
            </div>
        </div>
    )

    return (
        <Frame>
            <div ref={viewRef} className={cn("relative w-60 transition-opacity duration-500", VIEW_H, state.faded && "opacity-0")}>
                {/* The toast stays at the top of the view, as sonner's does. */}
                <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-center">
                    {toast && (
                        <Toast className="animate-in fade-in-0 slide-in-from-top-2">
                            {t("discountDialog.toastApplied", { amount: "2.00" })}
                        </Toast>
                    )}
                </div>
                <div ref={sceneRef} className="relative grid [&>*]:col-start-1 [&>*]:row-start-1">
                    {/* PaymentSection and the row of buttons under it, centred in the view. */}
                    <div className={cn("flex flex-col items-center justify-center self-start", VIEW_MIN_H)}>
                        <div className="flex w-52 flex-col gap-1.5 rounded-lg border bg-card p-2 shadow-sm">
                            <Expand open={discounted}>
                                <div className="flex flex-col text-[8px]">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>{t("payment.subtotal")}:</span>
                                        <span className="font-semibold">15.50 €</span>
                                    </div>
                                    <div className="flex justify-between text-green-600 dark:text-green-500">
                                        <span>{t("payment.discount")}:</span>
                                        <span className="font-semibold">-2.00 €</span>
                                    </div>
                                </div>
                            </Expand>
                            <div data-target="total" className="flex items-center justify-between">
                                <span className="text-[10px] font-semibold">{t("payment.total")}:</span>
                                <span key={total} className="text-sm font-bold text-amber-500 animate-in fade-in-0 zoom-in-90 duration-300">
                                    {total} €
                                </span>
                            </div>
                            {!mobile && (
                                <Expand open={cash}>
                                    <div className="grid grid-cols-2 gap-2 rounded-md border bg-muted/30 p-1.5">
                                        <div className="min-w-0">
                                            <p className="mb-0.5 text-[8px] font-medium">{t("payment.paidByCustomer")}</p>
                                            <MoneyInput target="paid" typed={paid && "20.00"} focused={done === 5} press={press} />
                                        </div>
                                        <div className="relative flex flex-col items-end justify-between">
                                            {/* The pointer rests just under the change, so the arrow does not hide it. */}
                                            <span data-target="change" className="absolute right-5 -bottom-2 size-0" />
                                            <span className="text-[8px] font-medium">{t("payment.change")}</span>
                                            {changed ? (
                                                <span className="text-xs font-bold text-green-600 animate-in fade-in-0 dark:text-green-500">6.50 €</span>
                                            ) : (
                                                <span className="text-xs font-bold text-red-600 dark:text-red-500">-{total} €</span>
                                            )}
                                        </div>
                                    </div>
                                </Expand>
                            )}
                            <p className="text-[8px] font-medium">{t("payment.paymentMethod")} *</p>
                            <div className="flex gap-1">
                                {mobile && (
                                    <span data-target="calculator" className={cn("flex", press("calculator"))}>
                                        <MiniButton><Calculator className="size-2.5" /></MiniButton>
                                    </span>
                                )}
                                <div className="flex flex-1">
                                    <span data-target="cash" className={cn("flex flex-1", press("cash"))}>
                                        <MiniButton variant={cash ? "default" : "outline"} className="flex-1 rounded-r-none border border-transparent transition-colors">
                                            <Banknote className="size-2.5" />
                                            {t("payment.cash")}
                                        </MiniButton>
                                    </span>
                                    <MiniButton className="flex-1 rounded-l-none">
                                        <CreditCard className="size-2.5" />
                                        {t("payment.card")}
                                    </MiniButton>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <MiniButton variant="destructive" className="size-6 px-0"><Trash2 className="size-3" /></MiniButton>
                                <MiniButton variant="default" className={cn("h-6 flex-1 text-[10px] font-semibold transition-opacity", !cash && "opacity-50")}>
                                    {t("cartSidebar.createOrder")}
                                </MiniButton>
                                <span data-target="percent" className={cn("flex", press("percent"))}>
                                    <MiniButton className="size-6 px-0"><Percent className="size-3" strokeWidth={2.5} /></MiniButton>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className={cn("pointer-events-none absolute -inset-[20rem] z-10 bg-black/50 transition-opacity duration-200", !(discountOpen || calculatorOpen) && "opacity-0")} />
                    <div className={cn("z-20 self-start justify-self-center pt-6 transition-[opacity,scale] duration-200", !discountOpen && "scale-95 opacity-0")}>
                        {discountDialog}
                    </div>
                    {mobile && (
                        <div className={cn("z-20 self-end justify-self-center pt-8 transition-[opacity,translate] duration-300", !calculatorOpen && "translate-y-8 opacity-0")}>
                            {calculator}
                        </div>
                    )}
                    <ScriptPointer ref={pointerRef} touch={mobile} state={state} />
                </div>
            </div>
        </Frame>
    )
}

/** Crea Ordine: disabled until a payment method is picked, then the order goes through. */
export function CreateOrderIllustration({ mobile }: { mobile: boolean }) {
    const { t } = useTranslation()
    return (
        <Frame>
            <div className="relative flex w-52 flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <Stack className="text-[9px] font-semibold">
                        <span className={mobile ? "" : off[3]}>{t("payment.total")}:</span>
                        {!mobile && <span className={on[3]}>{t("payment.lastOrderTotal")}:</span>}
                    </Stack>
                    <span className="text-sm font-bold text-amber-500">15.50 €</span>
                </div>
                {/* The last order's total stays for a while, with a bar running out. */}
                <div className={cn("h-0.5 w-full overflow-hidden rounded-full bg-muted", mobile ? "invisible" : on[3])}>
                    <div className="h-full bg-amber-500 motion-safe:animate-guide-drain-3" />
                </div>
                <div className="flex">
                    <ToggleButton tap={2} className="flex-1 [&>*]:rounded-r-none">
                        <Banknote className="size-2.5" />
                        {t("payment.cash")}
                    </ToggleButton>
                    <MiniButton className="flex-1 rounded-l-none">
                        <CreditCard className="size-2.5" />
                        {t("payment.card")}
                    </MiniButton>
                </div>
                <div className="flex items-center gap-1">
                    <MiniButton variant="destructive" className="size-6 px-0"><Trash2 className="size-3" /></MiniButton>
                    <Stack target="1 3" className={cn("flex-1", press[3])}>
                        <span className={off[2]}>
                            <MiniButton variant="default" className="h-6 text-[10px] font-semibold opacity-50">{t("cartSidebar.createOrder")}</MiniButton>
                        </span>
                        <MiniButton variant="default" className={cn("h-6 text-[10px] font-semibold", on[2])}>{t("cartSidebar.createOrder")}</MiniButton>
                        {mobile && (
                            <MiniButton className={cn("h-6 border-0 bg-green-500 text-[10px] font-semibold text-white", on[3])}>
                                <CheckCircle className="size-3" />
                                {t("mobile.orderConfirmed")}
                            </MiniButton>
                        )}
                    </Stack>
                    <MiniButton className="size-6 px-0"><Percent className="size-3" strokeWidth={2.5} /></MiniButton>
                </div>
                {/* Hovering the disabled button tells what is missing. */}
                {!mobile && (
                    <Between from={1} to={2} className="absolute top-[5.5rem] left-1/2 w-40 -translate-x-1/2">
                        <span className="block rounded-md bg-foreground px-2 py-1 text-[8px] text-background shadow">
                            • {t("guide.sampleMissingPayment")}
                        </span>
                    </Between>
                )}
                <Cursor touch={mobile} still={[1]} />
            </div>
        </Frame>
    )
}

type OrderStatus = "PENDING" | "CONFIRMED" | "PARTIAL" | "COMPLETED" | "PICKED_UP" | "CANCELLED"

interface SampleOrder {
    code: string
    customer: string
    table: string
    total: string
    time: string
    status: OrderStatus
    /** The ticket number a confirmed order gets. */
    number?: number
}

// Labels and colours as DailyOrderCard's statusMap; `info` is the guide's note on what the status means.
const STATUS_STYLE: Record<OrderStatus, { label: string; info: string; className: string }> = {
    PENDING: { label: "dailyOrderCard.statusPending", info: "guide.statusPendingInfo", className: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" },
    CONFIRMED: { label: "dailyOrderCard.statusConfirmed", info: "guide.statusConfirmedInfo", className: "bg-green-500/20 text-green-700 dark:text-green-400" },
    PARTIAL: { label: "orderStationStatus.partial", info: "guide.statusPartialInfo", className: "bg-orange-500/20 text-orange-700 dark:text-orange-400" },
    COMPLETED: { label: "dailyOrderCard.statusCompleted", info: "guide.statusCompletedInfo", className: "bg-pink-500/20 text-pink-700 dark:text-pink-400" },
    PICKED_UP: { label: "dailyOrderCard.statusPickedUp", info: "guide.statusPickedUpInfo", className: "bg-blue-500/20 text-blue-700 dark:text-blue-400" },
    CANCELLED: { label: "dailyOrderCard.statusCancelled", info: "guide.statusCancelledInfo", className: "bg-red-500/20 text-red-700 dark:text-red-400" },
}

/** `text` with the parts matching `term` highlighted, as the search does. */
function Highlight({ text, term }: { text: string; term: string }) {
    const at = term ? text.toLowerCase().indexOf(term.toLowerCase()) : -1
    if (at < 0) return <>{text}</>
    return (
        <>
            {text.slice(0, at)}
            <span className="rounded bg-amber-300 px-0.5 text-mist-950">{text.slice(at, at + term.length)}</span>
            {text.slice(at + term.length)}
        </>
    )
}

/** An order as DailyOrderCard draws it; `explain` adds the guide's note beside the status. */
function DailyOrderMock({
    order,
    term = "",
    press,
    explain = false,
    className,
}: {
    order: SampleOrder
    term?: string
    press: (target: string) => string
    explain?: boolean
    className?: string
}) {
    const { t } = useTranslation()
    const status = STATUS_STYLE[order.status]
    const pending = order.status === "PENDING"
    const cancellable = order.status === "CONFIRMED" || order.status === "COMPLETED" || order.status === "PICKED_UP"
    return (
        <div className={cn("flex flex-col gap-1 rounded-lg border bg-card p-1.5", className)}>
            <div className="flex items-baseline justify-between gap-1">
                <div className="flex min-w-0 items-baseline gap-1">
                    <span className="font-mono text-[11px] font-bold text-amber-600">{order.code}</span>
                    {order.number && (
                        <span className="truncate text-[7px] text-muted-foreground">
                            {t("dailyOrderCard.numeroOrdineLabel")}: {order.number}
                        </span>
                    )}
                </div>
                <span className="text-[10px] font-bold text-amber-600">{order.total} €</span>
            </div>
            <div className="min-w-0">
                <span className="block text-[7px] text-muted-foreground">
                    {t("dailyOrderCard.tablePrefix")} {order.table}
                </span>
                <p className="truncate text-[9px] font-medium">
                    <Highlight text={order.customer} term={term} />
                </p>
                <div className="flex items-center gap-1">
                    <span className="text-[7px] text-muted-foreground">{order.time}</span>
                    <span key={order.status} className={cn("relative shrink-0 rounded-full px-1.5 text-[7px] font-medium animate-in fade-in-0", status.className)}>
                        {t(status.label)}
                        {/* The pointer rests under the badge, so the arrow hides neither it nor the note. */}
                        <span data-target={`status-${order.code}`} className="absolute top-full left-1/2 size-0" />
                    </span>
                    {/* The note shows once the pointer has got to the badge. */}
                    <GuideNote className={cn("text-[7px] transition-opacity duration-300", explain ? "opacity-100 delay-500" : "opacity-0")}>
                        {t(status.info)}
                    </GuideNote>
                </div>
            </div>
            <div className="flex gap-1">
                <MiniButton className="flex-1"><Eye className="size-2.5" />{t("dailyOrderCard.view")}</MiniButton>
                <span data-target={`load-${order.code}`} className={cn("flex flex-1", press(`load-${order.code}`))}>
                    <MiniButton variant="default" className={cn("flex-1", !pending && "opacity-50")}>
                        <ShoppingCart className="size-2.5" />
                        {t("dailyOrderCard.load")}
                    </MiniButton>
                </span>
                <span data-target={`cancel-${order.code}`} className={cn("flex", press(`cancel-${order.code}`))}>
                    <MiniButton variant="destructive" className={cn("transition-opacity", !cancellable && "opacity-50")}><X className="size-2.5" /></MiniButton>
                </span>
            </div>
        </div>
    )
}

const ORDERS_DESKTOP: Move[] = [
    { target: "open-orders", after: 600 },
    // A new order comes in: the pointer and the view go to its status.
    { target: "status-XYZ", rest: true, after: 1700 },
    { target: "filter", after: 800 },
    // A tour of the other statuses, each with its note.
    { target: "status-DEF", rest: true, after: 1300 },
    { target: "status-MNO", rest: true, after: 1300 },
    { target: "status-GHI", rest: true, after: 1300 },
    { target: "status-PQR", rest: true, after: 1300 },
    { target: "status-JKL", rest: true, after: 1300 },
    { target: "search", after: 1000 },
    { target: "search-button", after: 800 },
    { target: "load-ABC" },
]
// Same steps on phones, where the filter is the tick toggle beside the search.
const ORDERS_MOBILE = ORDERS_DESKTOP
// Every order shown, before the search, with the note on the confirmed one.
const ORDERS_STILL: DemoState = { ...START, done: 2, aim: 3 }

/**
 * The day's orders: the list opens on the pending ones, a new one comes in,
 * the filter shows every order, a search narrows them, and Carica loads one.
 */
export function DailyOrdersIllustration({ mobile }: { mobile: boolean }) {
    const { t } = useTranslation()
    const moves = mobile ? ORDERS_MOBILE : ORDERS_DESKTOP
    const state = useScript(moves, ORDERS_STILL)
    const viewRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<HTMLDivElement>(null)
    const pointerRef = useRef<SVGSVGElement>(null)
    const press = pressOf(state, moves)

    const { done } = state
    const loaded = done >= 5
    // The phone drawer closes once an order is loaded; the sidebar stays.
    const open = done >= 1 && !(mobile && loaded)
    const arrived = state.aim >= 1
    const all = done >= 2
    const searched = done >= 4
    const surname = t("guide.sampleCustomer").split(" ").pop() ?? ""
    const term = searched ? surname : ""
    const aimed = moves[state.aim].target
    const explained = aimed.startsWith("status-") ? aimed.slice("status-".length) : null
    // After Carica the pointer points at the filled cart.
    useFollow({ scene: sceneRef, pointer: pointerRef, view: viewRef }, loaded ? "cart" : moves[state.aim].target, mobile, true, `${done}:${arrived}`)

    const orders: SampleOrder[] = [
        { code: "XYZ", customer: t("guide.sampleCustomer2"), table: "4", total: "22.00", time: "20:41", status: "PENDING" },
        { code: "ABC", customer: t("guide.sampleCustomer"), table: "12", total: "15.50", time: "20:32", status: "PENDING" },
        { code: "DEF", customer: t("guide.sampleCustomer3"), table: "7", total: "18.00", time: "20:18", status: "CONFIRMED", number: 27 },
        { code: "MNO", customer: t("guide.sampleCustomer2"), table: "5", total: "24.50", time: "20:05", status: "PARTIAL", number: 26 },
        { code: "GHI", customer: t("guide.sampleCustomer"), table: "3", total: "9.50", time: "19:55", status: "COMPLETED", number: 25 },
        { code: "PQR", customer: t("guide.sampleCustomer3"), table: "8", total: "31.00", time: "19:47", status: "PICKED_UP", number: 24 },
        { code: "JKL", customer: t("guide.sampleCustomer2"), table: "9", total: "12.00", time: "19:40", status: "CANCELLED", number: 23 },
    ]
    const shown = orders.filter(
        (order) =>
            (order.code !== "XYZ" || arrived) &&
            (all || order.status === "PENDING") &&
            (!searched || order.customer.toLowerCase().includes(surname.toLowerCase())),
    )

    const searchBox = (
        <div className="flex gap-1">
            <span
                data-target="search"
                className={cn(
                    "flex h-5 min-w-0 flex-1 items-center truncate rounded-md border bg-background px-1.5 text-[8px] transition-shadow",
                    done === 3 && "ring-2 ring-ring/50",
                    press("search"),
                )}
            >
                {done >= 3 ? <TypedOnce text={surname} /> : <span className="truncate text-muted-foreground">{t("dailyOrders.searchPlaceholder")}</span>}
            </span>
            <span data-target="search-button" className={cn("flex", press("search-button"))}>
                <MiniButton className="size-5 px-0"><Search className="size-2.5" /></MiniButton>
            </span>
            {mobile && (
                // The phone's filter: one tick for pending orders, two for all of them.
                <span data-target="filter" className={cn("flex", press("filter"))}>
                    <MiniButton className={cn("size-5 px-0 transition-colors", all && "bg-accent text-accent-foreground")}>
                        {all ? <CheckCheck className="size-2.5" /> : <Check className="size-2.5" />}
                    </MiniButton>
                </span>
            )}
        </div>
    )

    const list = (
        <div className="flex flex-col gap-1.5">
            {shown.map((order) => (
                // Two elements: each runs one animation, the slide in and the amber outline.
                <div key={order.code} className="relative animate-in fade-in-0 slide-in-from-top-1 duration-300">
                    <DailyOrderMock
                        order={order}
                        term={term}
                        press={press}
                        explain={explained === order.code}
                        // A new order comes in outlined in amber.
                        className={cn(order.code === "XYZ" && "motion-safe:animate-guide-flash")}
                    />
                </div>
            ))}
            {all && !searched && !mobile && (
                <p className="pt-0.5 text-center text-[7px] text-muted-foreground">{t("dailyOrders.last20Orders")}</p>
            )}
        </div>
    )

    // DailyOrdersSidebar on the desktop, MobileVerificaDrawer on phones.
    const panel = mobile ? (
        <div className="flex w-56 flex-col rounded-t-xl border bg-background shadow-lg">
            <div className="mx-auto mt-1.5 h-1 w-10 rounded-full bg-muted" />
            <span className="px-3 pt-2 pb-1.5 text-center text-[11px] font-semibold">{t("dailyOrders.title")}</span>
            <div className="flex flex-col gap-2 px-3 pb-3">
                {searchBox}
                {list}
            </div>
        </div>
    ) : (
        <div className="flex w-56 flex-col rounded-lg border bg-card">
            <div className="flex flex-col gap-1.5 border-b p-2">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold">{t("dailyOrders.title")}</span>
                    <X className="size-2.5" />
                </div>
                <span data-target="filter" className={cn("flex self-center", press("filter"))}>
                    <MiniButton className="gap-1 text-[7px] font-semibold">
                        <span className={all ? "text-muted-foreground" : "font-bold text-amber-500"}>{t("dailyOrders.filterPending")}</span>
                        <ArrowLeftRight className="size-2 text-muted-foreground" />
                        <span className={all ? "font-bold text-amber-500" : "text-muted-foreground"}>{t("dailyOrders.filterAll")}</span>
                    </MiniButton>
                </span>
                <FieldLabel>{t("dailyOrders.searchOrder")}</FieldLabel>
                {searchBox}
            </div>
            <div className="bg-background/60 p-2">{list}</div>
        </div>
    )

    return (
        <Frame>
            <div ref={viewRef} className={cn("relative w-60 transition-opacity duration-500", VIEW_H, state.faded && "opacity-0")}>
                {/* The toast stays at the top of the view, as sonner's does. */}
                <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-center">
                    {loaded && <Toast className="animate-in fade-in-0 slide-in-from-top-2">{t("toast.orderLoadedToCart", { displayCode: "ABC" })}</Toast>}
                </div>
                <div ref={sceneRef} className="relative grid [&>*]:col-start-1 [&>*]:row-start-1">
                    <div className="flex flex-col items-center gap-2 self-start pt-5">
                        {/* The top of the cart (the header on phones), with the button that opens the orders. */}
                        <div className="flex w-56 flex-col gap-1.5 rounded-lg border bg-card p-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-semibold">{mobile ? "MyCassa" : t("cartSidebar.title")}</span>
                                <span data-target="open-orders" className={cn("flex", press("open-orders"))}>
                                    <MiniButton variant={open && !mobile ? "default" : "outline"} className="border border-transparent transition-colors">
                                        {mobile ? t("mobile.header.verifyOrder") : t("cartSidebar.dailyOrders")}
                                    </MiniButton>
                                </span>
                            </div>
                            <div data-target="cart" className="rounded-md border bg-background/60 px-1.5 py-1 text-[8px]">
                                {loaded ? (
                                    <div key="loaded" className="flex flex-col gap-0.5 animate-in fade-in-0">
                                        <span className="font-medium">ABC · {t("guide.sampleCustomer")} · {t("dailyOrderCard.tablePrefix")} 12</span>
                                        <span className="flex justify-between"><span>2× {t("guide.sampleSandwich")}</span><span className="font-bold">12.00 €</span></span>
                                        <span className="flex justify-between"><span>1× {t("guide.sampleFries")}</span><span className="font-bold">3.50 €</span></span>
                                    </div>
                                ) : (
                                    <span className="block text-center text-muted-foreground">{t("cartSidebar.emptyCart")}</span>
                                )}
                            </div>
                        </div>
                        {!mobile && (
                            <Expand open={open} className="w-56">
                                {panel}
                            </Expand>
                        )}
                    </div>
                    {mobile && (
                        <>
                            <div className={cn("pointer-events-none absolute -inset-[20rem] z-10 bg-black/50 transition-opacity duration-200", !open && "opacity-0")} />
                            <div className={cn("z-20 self-start justify-self-center pt-10 transition-[opacity,translate] duration-300", !open && "translate-y-8 opacity-0")}>
                                {panel}
                            </div>
                        </>
                    )}
                    <ScriptPointer ref={pointerRef} touch={mobile} state={state} />
                </div>
            </div>
        </Frame>
    )
}

const CANCEL_MOVES: Move[] = [
    { target: "cancel-DEF", after: 700 },
    { target: "confirm-cancel", after: 600 },
    // Points at the ticket while it prints.
    { target: "ticket", rest: true },
]
// Cancelled, ticket printed.
const CANCEL_STILL: DemoState = { ...START, done: 2, aim: 2 }

/**
 * A confirmed order cancelled from its card: the X, the confirmation, the
 * order turning Annullato, and a ticket saying so coming out of the printer.
 */
export function CancelOrderIllustration({ mobile }: { mobile: boolean }) {
    const { t } = useTranslation()
    const state = useScript(CANCEL_MOVES, CANCEL_STILL)
    const viewRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<HTMLDivElement>(null)
    const pointerRef = useRef<SVGSVGElement>(null)
    const press = pressOf(state, CANCEL_MOVES)
    const { done } = state
    const asking = done === 1
    const cancelled = done >= 2
    useFollow({ scene: sceneRef, pointer: pointerRef, view: viewRef }, CANCEL_MOVES[state.aim].target, mobile, true, done)

    const order: SampleOrder = {
        code: "DEF",
        customer: t("guide.sampleCustomer3"),
        table: "7",
        total: "18.00",
        time: "20:18",
        status: cancelled ? "CANCELLED" : "CONFIRMED",
        number: 27,
    }

    return (
        <Frame>
            <div ref={viewRef} className={cn("relative w-60 transition-opacity duration-500", VIEW_H, state.faded && "opacity-0")}>
                <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-center">
                    {cancelled && <Toast className="animate-in fade-in-0 slide-in-from-top-2">{t("toast.orderCancelled")}</Toast>}
                </div>
                <div ref={sceneRef} className="relative grid [&>*]:col-start-1 [&>*]:row-start-1">
                    <div className="flex flex-col items-center self-start pt-6">
                        <DailyOrderMock order={order} press={press} className="w-52" />
                        {/* The printer, and the ticket it feeds out once the order is cancelled. */}
                        <div className="relative mt-3 flex flex-col items-center">
                            <div className="relative z-10 flex h-5 w-44 items-center justify-center gap-1 rounded-md border bg-muted text-[8px] font-medium text-muted-foreground shadow-sm">
                                <PrinterIcon className="size-3" />
                                {t("guide.samplePrinter")}
                                <span className="absolute inset-x-5 bottom-0.5 h-0.5 rounded-full bg-foreground/50" />
                            </div>
                            <div className="-mt-1 h-24 w-36 overflow-hidden">
                                {cancelled && (
                                    // Paper stays white in the dark theme too.
                                    <div className="bg-white px-2 pt-2 pb-1.5 font-mono text-[7px] leading-snug text-black shadow motion-safe:animate-guide-print">
                                        <p className="text-center text-[9px] font-bold uppercase">
                                            {t("orderDetailDialog.ticket")} #27
                                        </p>
                                        <p className="text-center">
                                            {t("dailyOrderCard.tablePrefix")} 7 · {t("guide.sampleCustomer3")}
                                        </p>
                                        <p className="my-1 bg-black py-0.5 text-center text-[9px] font-bold tracking-widest text-white uppercase">
                                            {t("dailyOrderCard.statusCancelled")}
                                        </p>
                                        <div className="border-y border-dashed border-black/60 py-0.5 line-through">
                                            <p>1× {t("guide.sampleSandwich")}</p>
                                            <p>2× {t("guide.sampleFries")}</p>
                                        </div>
                                        <p className="pt-0.5 text-center">20:52</p>
                                    </div>
                                )}
                            </div>
                            <span data-target="ticket" className="absolute top-14 -right-1 size-0" />
                        </div>
                    </div>
                    <div className={cn("pointer-events-none absolute -inset-[20rem] z-10 bg-black/50 transition-opacity duration-200", !asking && "opacity-0")} />
                    {/* The AlertDialog asking to confirm; below sm its buttons stack. */}
                    <div className={cn("z-20 self-start justify-self-center pt-8 transition-[opacity,scale] duration-200", !asking && "scale-95 opacity-0")}>
                        <div className="flex w-52 flex-col gap-2.5 rounded-lg border bg-background p-3 shadow-lg">
                            <div className="flex flex-col gap-1">
                                <span className="text-[11px] leading-none font-semibold">{t("dailyOrderCard.cancelDialogTitle")}</span>
                                <span className="text-[8px] leading-tight text-muted-foreground">
                                    {t("dailyOrderCard.cancelDialogDesc", { displayCode: "DEF" })}
                                </span>
                            </div>
                            <div className={cn("flex gap-1.5", mobile ? "flex-col-reverse" : "justify-end")}>
                                <MiniButton>{t("dailyOrderCard.cancelDialogCancel")}</MiniButton>
                                <span data-target="confirm-cancel" className={cn("flex", press("confirm-cancel"))}>
                                    <MiniButton variant="destructive" className="flex-1">{t("dailyOrderCard.cancelDialogConfirm")}</MiniButton>
                                </span>
                            </div>
                        </div>
                    </div>
                    <ScriptPointer ref={pointerRef} touch={mobile} state={state} />
                </div>
            </div>
        </Frame>
    )
}

/** The register badge and the drawer button in the header, then a printer warning. */
export function RegisterIllustration() {
    const { t } = useTranslation()
    return (
        <Frame>
            <div className="relative flex w-52 flex-col items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-lg border bg-card px-2 py-1.5 shadow-sm">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
                        {t("guide.sampleRegister")}
                    </span>
                    <MiniButton target="1" className={cn("size-6 px-0", press[1])}><Euro className="size-3" /></MiniButton>
                    <MiniButton className="size-6 px-0"><CircleHelp className="size-3" /></MiniButton>
                </div>
                <Stack className="w-full">
                    <Between from={1} to={2} className="self-start justify-self-center">
                        <Toast>{t("toast.drawerOpened")}</Toast>
                    </Between>
                    <span className={cn("block", off[3])}>
                        <span className="block rounded-lg border-2 border-destructive bg-background p-2 shadow-sm motion-safe:animate-guide-shake-2">
                            <span className="flex items-center gap-2">
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive/15">
                                    <PrinterIcon className="size-3.5 text-destructive" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block truncate text-[9px] font-semibold text-destructive">
                                        {t("toast.printerOffline", { label: t("guide.samplePrinter") })}
                                    </span>
                                    <span className="block text-[7px] leading-2.5 text-muted-foreground">{t("dialog.printerOfflineAction")}</span>
                                </span>
                            </span>
                            <MiniButton variant="destructive" target="3" className={cn("mt-1.5 py-0.5", press[3])}>
                                {t("dialog.printerOfflineDismiss")}
                            </MiniButton>
                        </span>
                    </span>
                </Stack>
                <Cursor touch={false} still={[2]} />
            </div>
        </Frame>
    )
}
