import { test, expect, type Page } from "@playwright/test"

async function noFonts(page: Page) {
  await page.context().route("https://fonts.googleapis.com/**", (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }))
}

test("first sign-in shows the welcome, and the full guide walks from step 1 onto the next step", async ({ page }) => {
  await noFonts(page)
  await page.addInitScript(() => localStorage.setItem("iqms.setupGuide.welcome", "show"))
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await page.goto("/")

  const welcome = page.getByRole("dialog", { name: /Welcome to ThryveMS/ })
  await expect(welcome).toBeVisible()
  await expect(welcome.getByRole("radio", { name: /Guide me through setup/ })).toBeChecked()
  await welcome.getByRole("button", { name: "Start setup" }).click()

  // step 1 opens Settings › Users and shows its first tip
  await expect(page).toHaveURL(/settings\/users/)
  const tip = page.getByRole("dialog", { name: "Your company's settings" })
  await expect(tip).toBeVisible()
  await expect(tip).toContainText("Step 1 of 11")
  await tip.getByRole("button", { name: "Next" }).click()
  await expect(page.getByRole("dialog", { name: "Invite your team" })).toBeVisible()
  await page.getByRole("button", { name: "Next" }).click()
  await page.getByRole("button", { name: "Done, next step" }).click()

  // the full guide carries on to step 2 on its own page
  await expect(page).toHaveURL(/qms\/organization/)
  await expect(page.getByRole("dialog", { name: "Where you stand" })).toContainText("Step 2 of 11")
  await page.getByRole("button", { name: "Exit guide" }).click()
  await expect(page.getByRole("dialog", { name: "Where you stand" })).toHaveCount(0)

  // progress is kept: Help shows 1 of 11 and the welcome doesn't come back after a reload
  await page.reload()
  await expect(page.getByRole("dialog", { name: /Welcome to ThryveMS/ })).toHaveCount(0)
  await page.getByRole("button", { name: /Help, setup 1 of 11 done/ }).click()
  await expect(page.getByRole("menuitem", { name: /Continue full guide/ })).toBeVisible()
  expect(errors).toEqual([])
})

test("a single step can be chosen from Help and stops at the end of that step", async ({ page }) => {
  await noFonts(page)
  await page.goto("/")
  await expect(page.getByRole("dialog", { name: /Welcome to ThryveMS/ })).toHaveCount(0)

  await page.getByRole("button", { name: /Help, setup/ }).click()
  await page.getByRole("menuitem", { name: "Choose a step" }).click()
  const panel = page.getByRole("dialog", { name: /Set up your QMS/ })
  await expect(panel).toBeVisible()
  await expect(panel.getByRole("listitem")).toHaveCount(11)
  await panel.getByRole("button", { name: "Start: Risks & Opportunities" }).click()

  await expect(page).toHaveURL(/\/risks/)
  await expect(page.getByRole("dialog", { name: "Add a risk or opportunity" })).toContainText("Step 7 of 11")
  await page.getByRole("button", { name: "Next" }).click()
  await page.getByRole("button", { name: "Next" }).click()
  await page.getByRole("button", { name: "Finish" }).click()

  // one step only: the checklist opens again with that step ticked
  const after = page.getByRole("dialog", { name: /Set up your QMS/ })
  await expect(after).toContainText("1 of 11 done")
  await expect(after.getByRole("button", { name: "Run again: Risks & Opportunities" })).toBeVisible()
})

test("Escape leaves the guide and the page stays usable", async ({ page }) => {
  await noFonts(page)
  await page.goto("/")
  await page.getByRole("button", { name: /Help, setup/ }).click()
  await page.getByRole("menuitem", { name: /Start full guide/ }).click()
  await expect(page.getByRole("dialog", { name: "Your company's settings" })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog", { name: "Your company's settings" })).toHaveCount(0)
  await expect(page.getByRole("heading", { name: "Users and access" })).toBeVisible()
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
