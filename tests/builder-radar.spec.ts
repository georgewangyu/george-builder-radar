import { expect, test } from "@playwright/test";
import { feeds } from "../lib/builder-feeds";

const archivePageSize = 12;

test.describe("George's Builder Radar", () => {
  test("catalog renders and lead unlock reveals the install command", async ({
    page,
    context,
    browserName,
  }) => {
    const payloads: Array<Record<string, unknown>> = [];

    if (browserName !== "firefox") {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    }
    await page.route("**/api/leads", async (route) => {
      payloads.push(JSON.parse(route.request().postData() || "{}") as Record<string, unknown>);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto("/");

    await expect(page).toHaveTitle("George's Builder Radar");
    await expect(page.getByRole("heading", { name: "George's Builder Radar", level: 1 })).toBeVisible();
    await expect(page.getByText("Public builder-signal feed")).toBeVisible();
    await expect(page.getByRole("heading", { name: feeds[0].title.replace("George's Builder Radar - ", ""), level: 2 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open feed" })).toHaveAttribute(
      "href",
      `/feeds/${feeds[0].id}`,
    );
    await expect(page.getByText("Use the radar inside your agent.")).toBeVisible();
    await expect(page.getByText("npx skills add georgewangyu/george-builder-radar")).toHaveCount(0);

    await page.getByLabel("Name").fill("Example User");
    await page
      .getByRole("region", { name: "Install and delivery utility rail" })
      .getByLabel("Email")
      .fill("person@example.com");
    await page.getByRole("button", { name: "Unlock command" }).click();
    await expect(page.getByRole("link", { name: "Star the repo" })).toHaveAttribute(
      "href",
      "https://github.com/georgewangyu/george-builder-radar",
    );
    await page.getByRole("button", { name: "Copy command" }).click();
    if (browserName !== "firefox") {
      await expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        "npx skills add georgewangyu/george-builder-radar --skill george-builder-radar -g",
      );
    } else {
      await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
    }
    expect(payloads[0]).toMatchObject({ name: "Example User", email: "person@example.com" });
  });

  test("archive filters and submit form work", async ({ page }) => {
    await page.route("**/api/submit", async (route) => {
      const body = route.request().postDataJSON();
      expect(body).toMatchObject({
        submissionType: "submit-signal",
        visibility: "public",
        title: "Agent memory note",
      });

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, issueNumber: 42 }),
      });
    });

    await page.goto("/");

    await page.getByPlaceholder("Search memory, MCP, agents, launch patterns...").fill("memory");
    await expect(page.locator(".archive-table").getByRole("link", { name: new RegExp(feeds[0].date) })).toBeVisible();
    await page.locator(".archive-table").getByRole("link", { name: new RegExp(feeds[0].date) }).click();
    await expect(page).toHaveURL(new RegExp(`/feeds/${feeds[0].id}$`));
    await expect(page.getByRole("heading", { name: "What moved today" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Repos worth studying" })).toBeVisible();

    await page.goto("/");

    await page.getByPlaceholder("Short title").fill("Agent memory note");
    await page
      .getByPlaceholder("Why does this belong on Builder Radar?")
      .fill("It captures a repeatable builder signal about agent memory infrastructure.");
    await page
      .getByPlaceholder("Drop the signal, context, source notes, or rough explanation.")
      .fill("The source points at compact memory, local memory, and codebase memory as one cluster.");
    await page.locator(".submit-form").evaluate((form) => {
      (form as HTMLFormElement).requestSubmit();
    });

    await expect(page.getByText("Signal sent for review.")).toBeVisible();
  });

  test("compact desk links navigate and panels do not clip content", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator(".rail .chip")).toHaveCount(0);
    const catalogChipTags = await page.locator(".catalog .compact-chips .chip").evaluateAll((chips) =>
      chips.map((chip) => chip.tagName.toLowerCase()),
    );
    expect(catalogChipTags).toEqual(["button", "button", "button", "button"]);

    await page.getByRole("button", { name: "Repos" }).click();
    await expect(page.getByRole("button", { name: "Repos" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".catalog-row").first()).toBeVisible();

    await page.getByRole("link", { name: "Open feed" }).click();
    await expect(page).toHaveURL(new RegExp(`/feeds/${feeds[0].id}$`));
    await expect(page.getByRole("heading", { name: "What moved today" })).toBeVisible();

    await page.goto("/");
    await page.locator(".catalog-row").nth(1).click();
    await expect(page).toHaveURL(new RegExp(`/feeds/${feeds[1].id}$`));

    await page.goto("/");
    const invalidHrefs = await page.locator('a[href^="Product Hunt"], a[href^="GitHub trending"], a[href^="N/A"]').count();
    expect(invalidHrefs).toBe(0);

    const panelMetrics = await page.locator(".mini-panel").evaluateAll((panels) =>
      panels.map((panel) => ({
        horizontalOverflow: panel.scrollWidth - panel.clientWidth,
        verticalOverflow: panel.scrollHeight - panel.clientHeight,
      })),
    );

    for (const metric of panelMetrics) {
      expect(metric.horizontalOverflow).toBeLessThanOrEqual(1);
      expect(metric.verticalOverflow).toBeLessThanOrEqual(1);
    }
  });

  test("archive pagination moves through feeds and resets for search", async ({ page }) => {
    const secondPageEnd = Math.min(archivePageSize * 2, feeds.length);

    await page.goto("/");

    await expect(page.getByText(`Page 1 of ${Math.ceil(feeds.length / archivePageSize)}`)).toBeVisible();
    await expect(page.getByText(`showing 1-${archivePageSize}`)).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();

    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText("Page 2 of")).toBeVisible();
    await expect(page.getByText(`showing ${archivePageSize + 1}-${secondPageEnd}`)).toBeVisible();

    await page.getByPlaceholder("Search memory, MCP, agents, launch patterns...").fill(feeds[0].date);
    await expect(page.locator(".archive-table").getByRole("link", { name: new RegExp(feeds[0].date) })).toBeVisible();
    await expect(page.getByText("Page 1 of")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Next", exact: true })).toHaveCount(0);
  });

  test("mobile layout has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/");

    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
    await expect(page.getByRole("navigation").getByRole("link", { name: "Skill", exact: true })).toBeVisible();
  });

  test("feed detail pages render source-backed sections", async ({ page }) => {
    await page.goto("/feeds/2026-06-30");

    await expect(page).toHaveTitle("2026-06-30 - George's Builder Radar");
    await expect(
      page.getByRole("heading", {
        name: "Agent systems are becoming operational products, not just chat surfaces",
        level: 1,
      }),
    ).toBeVisible();
    await expect(page.getByLabel("Feed date 2026-06-30")).toBeVisible();
    const detailHeadingSize = await page
      .getByRole("heading", {
        name: "Agent systems are becoming operational products, not just chat surfaces",
        level: 1,
      })
      .evaluate((heading) => Number.parseFloat(getComputedStyle(heading).fontSize));
    expect(detailHeadingSize).toBeLessThanOrEqual(58);
    await expect(page.getByRole("heading", { name: "What moved today" })).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Agent systems are becoming operational products, not just chat surfaces.",
      }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Repos worth studying" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "`usestrix/strix`" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Original links" })).toBeVisible();
  });

  test("wrapped feed fields are parsed without truncation", async () => {
    const feed = feeds.find((item) => item.id === "2026-07-08");

    expect(feed?.signals[0]).toMatchObject({
      title:
        "personal agents are blocked less by model quality than by local permissions, login state, inboxes, and verification surfaces.",
      why:
        "useful agents need boring infrastructure before they can safely handle real workflows: authenticated local context, email checks, approval gates, receipts, and stop conditions.",
    });
  });
});
