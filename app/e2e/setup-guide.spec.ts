import { test, expect, type Page } from "@playwright/test"

async function noFonts(page: Page) {
  await page.context().route("https://fonts.googleapis.com/**", (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }))
}

/** the open tip: the guide's dialog that says which step it is on */
const tip = (page: Page) => page.getByRole("dialog").filter({ hasText: /Step \d+ of \d+/ })

/**
 * Click through a step's tips until it ends: with its last tip's button, or, when the remaining tips are skipped,
 * with the checklist opening. Between tips the guide is briefly hidden while the next page opens, so wait for either.
 */
async function walkStep(page: Page, last: "Done, next step" | "Finish") {
  const panel = page.getByRole("dialog", { name: /Set up your QMS/ })
  for (let i = 0; i < 40; i++) {
    const t = tip(page)
    await expect(t.or(panel).first()).toBeVisible()
    if (await panel.isVisible()) return
    const end = t.getByRole("button", { name: last, exact: true })
    if (await end.isVisible()) return end.click()
    const heading = await t.getByRole("heading").innerText().catch(() => "")
    await t.getByRole("button", { name: "Next", exact: true }).click({ timeout: 3000 }).catch(() => undefined)
    // wait for the tip to change before looking again
    await expect(async () => {
      const now = await tip(page).getByRole("heading").innerText({ timeout: 500 }).catch(() => "")
      expect(now !== heading || (await panel.isVisible())).toBe(true)
    }).toPass({ timeout: 10_000 })
  }
  throw new Error("step did not end")
}

test("first sign-in shows the welcome, and the full guide walks a whole step and on to the next", async ({ page }) => {
  await noFonts(page)
  await page.addInitScript(() => localStorage.setItem("iqms.setupGuide.welcome", "show"))
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await page.goto("/")

  const welcome = page.getByRole("dialog", { name: /Welcome to ThryveMS/ })
  await expect(welcome).toBeVisible()
  await expect(welcome.getByRole("radio", { name: /Guide me through setup/ })).toBeChecked()
  await welcome.getByRole("button", { name: "Start setup" }).click()

  // step 1 starts on the company profile and moves across the settings pages
  await expect(page).toHaveURL(/settings\/organization/)
  await expect(tip(page)).toContainText("Step 1 of 11")
  await expect(page.getByRole("dialog", { name: "Your company profile" })).toBeVisible()
  await tip(page).getByRole("button", { name: "Next", exact: true }).click()
  await tip(page).getByRole("button", { name: "Next", exact: true }).click()
  await expect(page).toHaveURL(/settings\/users/)
  await expect(page.getByRole("dialog", { name: "Invite your team" })).toBeVisible()
  await walkStep(page, "Done, next step")

  // the full guide carries on to step 2 on its own page
  await expect(page).toHaveURL(/qms\/organization/)
  await expect(page.getByRole("dialog", { name: "Where you stand" })).toContainText("Step 2 of 11")
  await page.getByRole("button", { name: "Exit guide" }).click()
  await expect(tip(page)).toHaveCount(0)

  // progress is kept: Help shows 1 of 11 and the welcome doesn't come back after a reload
  await page.reload()
  await expect(page.getByRole("dialog", { name: /Welcome to ThryveMS/ })).toHaveCount(0)
  await page.getByRole("button", { name: /Help, setup 1 of 11 done/ }).click()
  await expect(page.getByRole("menuitem", { name: /Continue full guide/ })).toBeVisible()
  expect(errors).toEqual([])
})

test("the Management Review tour goes through all seven stages on practice records", async ({ page }) => {
  await noFonts(page)
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await page.goto("/")
  await page.getByRole("button", { name: /Help, setup/ }).click()
  await page.getByRole("menuitem", { name: "Choose a step" }).click()
  await page.getByRole("dialog", { name: /Set up your QMS/ }).getByRole("button", { name: "Start: Management Review" }).click()

  await expect(page).toHaveURL(/\/management-review$/)
  const seen: string[] = []
  for (let i = 0; i < 25; i++) {
    const t = tip(page)
    await expect(t).toBeVisible()
    seen.push((await t.getByRole("heading").innerText()).trim())
    const finish = t.getByRole("button", { name: "Finish", exact: true })
    if (await finish.isVisible()) {
      await finish.click()
      break
    }
    await t.getByRole("button", { name: "Next", exact: true }).click()
  }
  for (const stage of ["Stage 1", "Stage 2", "Stage 3", "Stage 4", "Stage 5", "Stage 6", "Stage 7"]) expect(seen.some((s) => s.startsWith(stage))).toBe(true)

  // practice tips say so, and the tour ends on the checklist with the step ticked
  const after = page.getByRole("dialog", { name: /Set up your QMS/ })
  await expect(after).toContainText("1 of 11 done")
  await expect(after.getByRole("button", { name: "Run again: Management Review" })).toBeVisible()
  expect(errors).toEqual([])
})

test("practice tips are labelled and the page behind them can't be changed", async ({ page }) => {
  await noFonts(page)
  await page.goto("/")
  await page.getByRole("button", { name: /Help, setup/ }).click()
  await page.getByRole("menuitem", { name: "Choose a step" }).click()
  await page.getByRole("dialog", { name: /Set up your QMS/ }).getByRole("button", { name: "Start: Risks & Opportunities" }).click()
  await expect(tip(page)).toContainText("Step 7 of 11")
  for (let i = 0; i < 3; i++) await tip(page).getByRole("button", { name: "Next", exact: true }).click()
  await expect(page).toHaveURL(/risks\/R-031/)
  await expect(tip(page)).toContainText("Practice record")
  // the overlay sits over the page, so its buttons can't be pressed while the tip is open
  await expect(page.getByRole("button", { name: "Mark reviewed today" })).toBeVisible()
  await page.getByRole("button", { name: "Mark reviewed today" }).click({ trial: true, timeout: 1500 }).then(
    () => {
      throw new Error("page button was clickable under the guide")
    },
    () => undefined
  )
})

test("a tip whose practice record isn't available is skipped", async ({ page }) => {
  await noFonts(page)
  // Ben Castillo works in Operations only, so the Purchasing practice risk R-031 doesn't open for him
  await page.addInitScript(() => localStorage.setItem("iqms.viewAs", "p-bc"))
  await page.goto("/")
  await page.getByRole("button", { name: /Help, setup/ }).click()
  await page.getByRole("menuitem", { name: "Choose a step" }).click()
  await page.getByRole("dialog", { name: /Set up your QMS/ }).getByRole("button", { name: "Start: Risks & Opportunities" }).click()
  await walkStep(page, "Finish")
  await expect(page.getByRole("dialog", { name: /Set up your QMS/ })).toContainText("1 of")
  await expect(page.getByText("This page or record doesn’t exist")).toHaveCount(0)
})

test("Escape leaves the guide and the page stays usable", async ({ page }) => {
  await noFonts(page)
  await page.goto("/")
  await page.getByRole("button", { name: /Help, setup/ }).click()
  await page.getByRole("menuitem", { name: /Start full guide/ }).click()
  await expect(page.getByRole("dialog", { name: "Your company profile" })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(tip(page)).toHaveCount(0)
  await expect(page.getByRole("heading", { name: "Organization profile" })).toBeVisible()
})

test("each person sees only the steps their role can open", async ({ page }) => {
  await noFonts(page)
  // Joy Aquino is a process owner: no Settings › Users and access, so no "Your company" step
  await page.addInitScript(() => localStorage.setItem("iqms.viewAs", "p-ja"))
  await page.goto("/")
  await page.getByRole("button", { name: /Help, setup 0 of 10 done/ }).click()
  await page.getByRole("menuitem", { name: "Choose a step" }).click()
  const panel = page.getByRole("dialog", { name: /Set up your QMS/ })
  await expect(panel.getByRole("listitem")).toHaveCount(10)
  await expect(panel).not.toContainText("Your company")
  await panel.getByRole("button", { name: "Start full guide" }).click()
  await expect(page).toHaveURL(/qms\/organization/)
  await expect(page.getByRole("dialog", { name: "Where you stand" })).toContainText("Step 1 of 10")
})
