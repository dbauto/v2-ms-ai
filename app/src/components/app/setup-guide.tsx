import * as React from "react"
import { createPortal } from "react-dom"
import { useLocation, useNavigate } from "react-router-dom"
import { CheckIcon, CircleHelpIcon, LifeBuoyIcon, MapIcon, PlayIcon, RotateCcwIcon } from "lucide-react"

import { GUIDE_STEPS, type GuideStep } from "@/data/setup-guide"
import { useStore } from "@/lib/store"
import { defaultSettingsAccess } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Guided setup for a new company: a welcome on first sign-in, a checklist of the 11 setup steps, and tips shown
 * on the real pages. People can run the full guide in order or pick one step from the checklist, and come back to
 * it from Help in the top bar. The guide only shows and explains; it never creates or changes records.
 *
 * Each person sees only the steps whose page their role can open (a process owner without Settings or Audits gets
 * fewer steps); counts and "Step n of N" follow that list.
 *
 * In the preview, progress is kept in this browser per person. In production it is saved per person on the server,
 * so it follows them across devices.
 */

const KEY = "iqms.setupGuide"

/**
 * The welcome opens by itself the first time a person signs in. Automated browser tests skip it so it doesn't cover
 * the pages they test, unless a test asks for it by setting `iqms.setupGuide.welcome` to "show".
 */
function autoWelcome() {
  try {
    if (localStorage.getItem(`${KEY}.welcome`) === "show") return true
  } catch {
    /* storage blocked */
  }
  return !navigator.webdriver
}

interface Run {
  /** full: carry on to the next step at the end of a step; step: stop after this step */
  mode: "full" | "step"
  step: number
  tip: number
  /** which way the person is going, so a tip whose page isn't available is skipped in that direction */
  dir: 1 | -1
}

interface Saved {
  welcomeSeen: boolean
  done: string[]
}

interface GuideApi {
  /** the steps this person's role can open, in guide order */
  steps: GuideStep[]
  done: string[]
  run: Run | null
  panelOpen: boolean
  setPanelOpen: (open: boolean) => void
  /** start the full guide at the first step not done yet, or at a given step */
  startFull: (step?: number) => void
  /** run one step only */
  startStep: (step: number) => void
  next: () => void
  back: () => void
  /** move past a tip whose page or record isn't available */
  skip: () => void
  exit: () => void
  resetProgress: () => void
  welcomeOpen: boolean
  closeWelcome: () => void
}

const GuideContext = React.createContext<GuideApi | null>(null)

export function useSetupGuide() {
  const ctx = React.useContext(GuideContext)
  if (!ctx) throw new Error("useSetupGuide must be used inside <SetupGuideProvider>")
  return ctx
}

function load(userId: string): Saved {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, Saved>
    return all[userId] ?? { welcomeSeen: false, done: [] }
  } catch {
    return { welcomeSeen: false, done: [] }
  }
}

function save(userId: string, s: Saved) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, Saved>
    all[userId] = s
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* storage blocked: progress lasts until the page is reloaded */
  }
}

export function SetupGuideProvider({ children }: { children: React.ReactNode }) {
  const { user, role, can } = useStore()
  // same rule as Settings › Users and access: a role's own page list if it has one, otherwise its levels (ADR-045)
  const steps = React.useMemo(
    () =>
      GUIDE_STEPS.filter((s) =>
        s.area === "Settings" ? (role.settingsPages?.length ? role.settingsPages.includes(s.path) : defaultSettingsAccess(role, "admin")) : can(s.area)
      ),
    [can, role]
  )
  const navigate = useNavigate()
  const [saved, setSaved] = React.useState<Saved>(() => load(user.id))
  const [run, setRun] = React.useState<Run | null>(null)
  const [panelOpen, setPanelOpen] = React.useState(false)

  // switching person in the preview shows that person's own progress
  React.useEffect(() => {
    setSaved(load(user.id))
    setRun(null)
  }, [user.id])

  const update = React.useCallback(
    (fn: (s: Saved) => Saved) =>
      setSaved((s) => {
        const n = fn(s)
        save(user.id, n)
        return n
      }),
    [user.id]
  )

  const go = React.useCallback(
    (r: Run | null) => {
      setRun(r)
      if (r) {
        setPanelOpen(false)
        navigate(steps[r.step].tips[r.tip]?.path ?? steps[r.step].path)
      }
    },
    [navigate, steps]
  )

  const markDone = (step: number) => update((s) => ({ ...s, done: Array.from(new Set([...s.done, steps[step].id])) }))

  const visibleDone = saved.done.filter((id) => steps.some((s) => s.id === id))
  const api: GuideApi = {
    steps,
    done: visibleDone,
    run,
    panelOpen,
    setPanelOpen,
    startFull: (step) => {
      const first = steps.findIndex((s) => !saved.done.includes(s.id))
      go({ mode: "full", step: step ?? (first < 0 ? 0 : first), tip: 0, dir: 1 })
    },
    startStep: (step) => go({ mode: "step", step, tip: 0, dir: 1 }),
    next: () => {
      if (!run) return
      const step = steps[run.step]
      if (run.tip < step.tips.length - 1) return setRun({ ...run, tip: run.tip + 1, dir: 1 })
      markDone(run.step)
      if (run.mode === "full" && run.step < steps.length - 1) return go({ ...run, step: run.step + 1, tip: 0, dir: 1 })
      // end on the step's own page, not on a practice record or a page that wasn't available
      setRun(null)
      navigate(step.path)
      setPanelOpen(true)
    },
    back: () => {
      if (!run) return
      if (run.tip > 0) return setRun({ ...run, tip: run.tip - 1, dir: -1 })
      if (run.mode === "full" && run.step > 0) go({ ...run, step: run.step - 1, tip: steps[run.step - 1].tips.length - 1, dir: -1 })
    },
    skip: () => {
      if (!run) return
      const atStart = run.tip === 0 && (run.mode === "step" || run.step === 0)
      if (run.dir === -1 && !atStart) return api.back()
      api.next()
    },
    exit: () => setRun(null),
    resetProgress: () => update((s) => ({ ...s, done: [] })),
    welcomeOpen: steps.length > 0 && !saved.welcomeSeen && autoWelcome() && !run,
    closeWelcome: () => update((s) => ({ ...s, welcomeSeen: true })),
  }

  return (
    <GuideContext.Provider value={api}>
      {children}
      <WelcomeDialog />
      <GuidePanel />
      {run && <Coach />}
    </GuideContext.Provider>
  )
}

/* ---------- Welcome, on first sign-in ---------- */

type Choice = "full" | "pick" | "later"

function WelcomeDialog() {
  const g = useSetupGuide()
  const GUIDE_STEPS = g.steps
  const { user } = useStore()
  const [choice, setChoice] = React.useState<Choice>("full")
  const first = user.name.split(" ")[0]
  const options: { v: Choice; title: string; body: string; recommended?: boolean }[] = [
    { v: "full", title: "Guide me through setup", body: `${GUIDE_STEPS.length} steps, from your company to corrective action. Each step takes you to the right page and explains what ISO asks for there.`, recommended: true },
    { v: "pick", title: "Let me choose a part", body: "See the list of steps and start with the one you need now." },
    { v: "later", title: "I'll explore on my own", body: "You can start the guide any time from Help in the top bar." },
  ]
  const start = () => {
    g.closeWelcome()
    if (choice === "full") g.startFull(0)
    if (choice === "pick") g.setPanelOpen(true)
  }
  return (
    <Dialog open={g.welcomeOpen} onOpenChange={(o) => !o && g.closeWelcome()}>
      <DialogContent className="max-w-[640px] gap-6 p-8">
        <DialogHeader className="gap-3">
          <span className="flex items-center gap-2.5 text-[0.8125rem] text-muted-foreground">
            <GuideMark /> Setup guide
          </span>
          <DialogTitle className="text-[1.75rem] font-semibold">Welcome to ThryveMS, {first}</DialogTitle>
          <DialogDescription className="text-[0.9375rem] leading-relaxed">
            Setting up a quality management system has a lot of firsts. We’ll walk you through it in the same order an auditor looks at it. You can stop at any time and pick up where you left off.
          </DialogDescription>
        </DialogHeader>
        <div role="radiogroup" aria-label="How do you want to start?" className="flex flex-col gap-2.5">
          {options.map((o) => (
            <label key={o.v} className={cn("flex cursor-pointer items-start gap-3.5 rounded-md border p-4", choice === o.v ? "border-primary bg-highlight" : "hover:bg-hover")}>
              <input type="radio" name="guide-start" value={o.v} checked={choice === o.v} onChange={() => setChoice(o.v)} className="mt-1 size-4 accent-[var(--primary)]" />
              <span className="flex flex-col gap-1">
                <span className="flex items-center gap-2 text-[0.9375rem] font-semibold">
                  {o.title}
                  {o.recommended && <Badge tone="done">Recommended</Badge>}
                </span>
                <span className="text-[0.8125rem] leading-normal text-muted-foreground">{o.body}</span>
              </span>
            </label>
          ))}
        </div>
        <DialogFooter className="items-center">
          <span className="mr-auto text-xs text-muted-foreground">Restart any time from Help › Setup guide</span>
          <Button variant="ghost" onClick={() => g.closeWelcome()}>Not now</Button>
          <Button onClick={start}>{choice === "later" ? "Close" : choice === "pick" ? "Show the steps" : "Start setup"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- The checklist of steps ---------- */

function GuidePanel() {
  const g = useSetupGuide()
  const GUIDE_STEPS = g.steps
  const count = g.done.length
  const pct = Math.round((count / GUIDE_STEPS.length) * 100)
  const allDone = count >= GUIDE_STEPS.length
  return (
    <Sheet open={g.panelOpen} onOpenChange={g.setPanelOpen}>
      <SheetContent className="max-w-[460px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2.5">
            <GuideMark /> Set up your QMS
          </SheetTitle>
          <SheetDescription>Run the full guide in order, or start any step on its own.</SheetDescription>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuemin={0} aria-valuemax={GUIDE_STEPS.length} aria-valuenow={count} aria-label="Setup progress">
              <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[0.8125rem] text-muted-foreground">
              {count} of {GUIDE_STEPS.length} done
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => g.startFull()} disabled={allDone}>
              <PlayIcon /> {count === 0 ? "Start full guide" : "Continue full guide"}
            </Button>
            {count > 0 && (
              <Button variant="ghost" onClick={() => g.resetProgress()}>
                <RotateCcwIcon /> Start over
              </Button>
            )}
          </div>
        </SheetHeader>
        <SheetBody className="flex flex-col gap-1">
          <ol className="flex flex-col gap-1">
            {GUIDE_STEPS.map((s, i) => (
              <StepRow key={s.id} step={s} index={i} done={g.done.includes(s.id)} next={!allDone && GUIDE_STEPS.findIndex((x) => !g.done.includes(x.id)) === i} onStart={() => g.startStep(i)} />
            ))}
          </ol>
          {allDone && <p className="mt-3 rounded-md bg-done-tint px-4 py-3 text-sm text-done">All {GUIDE_STEPS.length} steps done. You can run any step again from this list.</p>}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

function StepRow({ step, index, done, next, onStart }: { step: GuideStep; index: number; done: boolean; next: boolean; onStart: () => void }) {
  return (
    <li className={cn("flex items-start gap-3 rounded-md px-3 py-2.5", next && "border border-info-border bg-highlight")}>
      <span
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          done ? "bg-done text-background" : next ? "bg-primary text-primary-foreground" : "border border-input text-muted-foreground"
        )}
        aria-hidden="true"
      >
        {done ? <CheckIcon className="size-3.5" /> : index + 1}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn("text-sm", next && "font-semibold")}>
          {step.title}
          <span className="sr-only">{done ? ", done" : ""}</span>
        </span>
        <span className="text-[0.8125rem] text-muted-foreground">{step.summary}</span>
        <span className="text-xs text-muted-foreground">ISO 9001 {step.clauses}</span>
      </span>
      <Button size="sm" variant={next ? "default" : "outline"} onClick={onStart} aria-label={`${done ? "Run again" : "Start"}: ${step.title}`}>
        {done ? "Run again" : "Start"}
      </Button>
    </li>
  )
}

/* ---------- Tips on the page ---------- */

function findTarget(target: string): HTMLElement | null {
  for (const t of target.split("||").map((x) => x.trim())) {
    let el: Element | null = null
    if (t.startsWith("text:")) {
      const label = t.slice(5)
      el = Array.from(document.querySelectorAll<HTMLElement>("main button, main a")).find((b) => b.innerText.trim() === label) ?? null
    } else if (t.startsWith("card:")) {
      const title = t.slice(5)
      el = Array.from(document.querySelectorAll<HTMLElement>("main [data-slot=card-title]")).find((h) => h.innerText.trim() === title)?.closest("[data-slot=card]") ?? null
    } else if (t.startsWith("tab:")) {
      const label = t.slice(4)
      el = Array.from(document.querySelectorAll<HTMLElement>("main [role=tab]")).find((b) => b.innerText.replace(/\s+/g, " ").trim().startsWith(label)) ?? null
    } else if (t === "track") {
      el = document.querySelector("main ol[aria-label=Progress]")
    } else if (t === "figures") {
      el = document.querySelector("main [data-guide=figures]")
    } else {
      try {
        el = document.querySelector(t)
      } catch {
        el = null
      }
    }
    if (el instanceof HTMLElement && el.getClientRects().length) return el
  }
  return null
}

/** a tab is open when it's selected; anything else counts as open once pressed */
function isOpen(el: HTMLElement) {
  return el.getAttribute("role") !== "tab" || el.getAttribute("aria-selected") === "true"
}

/** press a tab or button the way a pointer does: tabs listen for mouse down, buttons for click */
function press(el: HTMLElement) {
  const opts = { bubbles: true, cancelable: true, button: 0, pointerType: "mouse" }
  el.dispatchEvent(new PointerEvent("pointerdown", opts))
  el.dispatchEvent(new MouseEvent("mousedown", opts))
  el.dispatchEvent(new PointerEvent("pointerup", opts))
  el.dispatchEvent(new MouseEvent("mouseup", opts))
  if (el.getAttribute("role") !== "tab") el.click()
}

const PAD = 6
const TIP_W = 380
const GAP = 16
/** height of the sticky top bar, which covers the top of the page */
const TOP = 72

/** scroll so the part sits just under the top bar when it's taller than half the screen, otherwise only as far as needed */
function scrollToShow(el: HTMLElement) {
  const r = el.getBoundingClientRect()
  const vh = window.innerHeight
  if (r.top >= TOP + PAD && r.bottom <= vh - PAD && r.height < vh / 2) return
  window.scrollBy({ top: r.top - TOP - PAD - GAP, behavior: "instant" as ScrollBehavior })
}

/**
 * Put the tip next to the highlighted part, never on top of it: below, above, right or left, whichever fits first.
 * When the part is too big for any of those (a long table or a whole tab), the highlight is cut at the bottom of what
 * can be shown and the tip sits under it, so the tip still covers nothing it talks about.
 */
function placeTip(rect: DOMRect | null, w: number, h: number, vw: number, vh: number): { card: React.CSSProperties; spot?: React.CSSProperties } {
  const clampX = (x: number) => Math.min(Math.max(16, x), vw - w - 16)
  const clampY = (y: number) => Math.min(Math.max(TOP + 8, y), vh - h - 16)
  if (!rect) return { card: { left: (vw - w) / 2, top: Math.max(TOP + 8, (vh - h) / 2) } }
  const box = { left: rect.left - PAD, top: Math.max(rect.top - PAD, TOP), right: rect.right + PAD, bottom: Math.min(rect.bottom + PAD, vh) }
  const spot = (b: typeof box): React.CSSProperties => ({ left: b.left, top: b.top, width: b.right - b.left, height: Math.max(0, b.bottom - b.top) })
  const alignX = rect.width < w ? clampX(rect.right - w) : clampX(rect.left)
  if (box.bottom + GAP + h <= vh - 16) return { card: { left: alignX, top: box.bottom + GAP }, spot: spot(box) }
  if (box.top - GAP - h >= TOP + 8) return { card: { left: alignX, top: box.top - GAP - h }, spot: spot(box) }
  if (box.right + GAP + w <= vw - 16) return { card: { left: box.right + GAP, top: clampY(box.top) }, spot: spot(box) }
  if (box.left - GAP - w >= 16) return { card: { left: box.left - GAP - w, top: clampY(box.top) }, spot: spot(box) }
  // too big to sit beside: show the top of the part and put the tip under it
  const cut = vh - 16 - h - GAP
  return { card: { left: alignX, top: cut + GAP }, spot: spot({ ...box, bottom: Math.max(box.top + 48, cut) }) }
}

function Coach() {
  const g = useSetupGuide()
  const GUIDE_STEPS = g.steps
  const { pathname } = useLocation()
  const run = g.run!
  const step = GUIDE_STEPS[run.step]
  const tip = step.tips[run.tip]
  const [rect, setRect] = React.useState<DOMRect | null>(null)
  const [searching, setSearching] = React.useState(true)
  const cardRef = React.useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [cardH, setCardH] = React.useState(0)
  const [openFailed, setOpenFailed] = React.useState(false)
  React.useLayoutEffect(() => {
    const el = cardRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setCardH(el.offsetHeight))
    ro.observe(el)
    setCardH(el.offsetHeight)
    return () => ro.disconnect()
  })
  const tipPath = tip.path ?? step.path
  const onPage = pathname === tipPath

  // each tip can be on its own page
  React.useEffect(() => {
    if (!onPage) navigate(tipPath)
  }, [onPage, tipPath, navigate])

  // once the page has opened: skip the tip if its record isn't there, open a tab if the tip asks for one, then find the
  // part to highlight. Pages can load lazily, so keep looking for a few seconds.
  React.useEffect(() => {
    if (!onPage) return
    setSearching(true)
    setOpenFailed(false)
    setRect(null)
    let el: HTMLElement | null = null
    let opened = !tip.open
    let tries = 0
    const measure = () => el && setRect(el.getBoundingClientRect())
    const id = window.setInterval(() => {
      tries++
      if (tries > 3 && document.querySelector("main")?.textContent?.includes("This page or record doesn’t exist")) {
        window.clearInterval(id)
        g.skip()
        return
      }
      if (!opened) {
        // tabs switch on mouse down, not on click, so press the tab the way a person would, then wait until it's
        // really the open tab before looking for the part to highlight
        const trigger = findTarget(tip.open!)
        if (trigger && isOpen(trigger)) opened = true
        else if (trigger) {
          press(trigger)
          if (tries <= 30) return
        }
        if (!opened && tries <= 30) return
        if (!opened) setOpenFailed(true)
        opened = true
      }
      el = findTarget(tip.target)
      if (el || tries > 30) {
        window.clearInterval(id)
        setSearching(false)
        if (el) {
          scrollToShow(el)
          measure()
        }
      }
    }, 100)
    window.addEventListener("resize", measure)
    window.addEventListener("scroll", measure, true)
    return () => {
      window.clearInterval(id)
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", measure, true)
    }
  }, [onPage, tip.target, tip.open, run.step, run.tip])

  // move focus to the tip so keyboard and screen reader users follow along; Esc leaves the guide
  React.useEffect(() => {
    if (!searching) cardRef.current?.focus()
  }, [searching, run.step, run.tip])
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && g.exit()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [g])

  if (!onPage || searching) return null

  const vw = window.innerWidth
  const vh = window.innerHeight
  const w = Math.min(TIP_W, vw - 32)
  const place = placeTip(rect, w, cardH, vw, vh)
  const last = run.tip === step.tips.length - 1
  const cta = !last ? "Next" : run.mode === "step" || run.step === GUIDE_STEPS.length - 1 ? "Finish" : "Done, next step"
  const canBack = run.tip > 0 || (run.mode === "full" && run.step > 0)

  return createPortal(
    <div className="fixed inset-0 z-[60]" data-guide-overlay>
      {rect && place.spot ? (
        <div
          aria-hidden="true"
          data-guide-spot
          className="pointer-events-none fixed rounded-lg shadow-[0_0_0_9999px_var(--overlay)] outline-2 outline-primary transition-all duration-200"
          style={place.spot}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-overlay" />
      )}
      <div
        ref={cardRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-tip-title"
        aria-describedby="guide-tip-body"
        data-guide-open-failed={openFailed || undefined}
        className="fixed flex flex-col gap-2.5 rounded-xl border bg-card p-5 shadow-[0_24px_64px_-24px_rgba(24,32,43,0.35)] outline-none"
        style={{ ...place.card, width: w, visibility: cardH ? "visible" : "hidden" }}
      >
        <div className="flex items-center gap-2.5">
          <GuideMark />
          <span className="text-xs text-muted-foreground">
            Step {run.step + 1} of {GUIDE_STEPS.length} · {step.title} · {run.tip + 1} of {step.tips.length}
          </span>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={g.exit}>
            Exit guide
          </Button>
        </div>
        <h2 id="guide-tip-title" className="text-[1.0625rem] font-semibold">
          {tip.title}
        </h2>
        <p id="guide-tip-body" className="text-sm leading-relaxed text-muted-foreground">
          {tip.body}
        </p>
        <p className="rounded-sm bg-background px-2.5 py-2 text-xs text-muted-foreground">ISO 9001: {tip.iso}</p>
        {tip.practice && (
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Badge tone="draft">Practice record</Badge>
            <span>A sample record so you can see this stage. Nothing on it is changed.</span>
          </p>
        )}
        <div className="mt-1 flex items-center gap-2">
          <Button variant="ghost" onClick={g.back} disabled={!canBack}>
            Back
          </Button>
          <span className="mx-auto h-1.5 w-20 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
            <span className="block h-full bg-primary" style={{ width: `${((run.tip + 1) / step.tips.length) * 100}%` }} />
          </span>
          <Button onClick={g.next}>{cta}</Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ---------- Help in the top bar ---------- */

export function HelpMenu() {
  const g = useSetupGuide()
  const GUIDE_STEPS = g.steps
  const navigate = useNavigate()
  const count = g.done.length
  if (!GUIDE_STEPS.length) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-10 cursor-pointer items-center gap-2 rounded-sm px-2.5 text-sm hover:bg-secondary" aria-label={`Help, setup ${count} of ${GUIDE_STEPS.length} done`}>
        <CircleHelpIcon className="size-[1.125rem] text-muted-foreground" />
        <span className="hidden lg:inline">Help</span>
        {count < GUIDE_STEPS.length && (
          <span className="hidden h-5 items-center rounded-full bg-accent px-1.5 text-[0.6875rem] font-semibold text-accent-foreground sm:inline-flex">
            {count}/{GUIDE_STEPS.length}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Setup guide</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => g.startFull()} disabled={count >= GUIDE_STEPS.length}>
          <PlayIcon />
          <span className="flex flex-col">
            <span>{count === 0 ? "Start full guide" : "Continue full guide"}</span>
            <span className="text-xs text-muted-foreground">
              {count} of {GUIDE_STEPS.length} steps done
            </span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => g.setPanelOpen(true)}>
          <MapIcon /> Choose a step
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/settings/support")}>
          <LifeBuoyIcon /> Contact support
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function GuideMark() {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-accent text-accent-foreground" aria-hidden="true">
      <MapIcon className="size-4" />
    </span>
  )
}
