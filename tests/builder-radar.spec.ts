import { expect, test } from "@playwright/test";
import { feeds } from "../lib/builder-feeds";

const archivePageSize = 12;

test.describe("George's Builder Radar", () => {
  test("catalog renders and lead unlock reveals the install command", async ({ page, context }) => {
    const payloads: Array<Record<string, unknown>> = [];

    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
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
    await expect(page.getByRole("heading", { name: "Top signals", level: 2 })).toBeVisible();
    await expect(page.getByRole("heading", { name: feeds[0].date, level: 2 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open feed" })).toHaveAttribute(
      "href",
      `/feeds/${feeds[0].id}`,
    );
    await expect(page.getByText("Use George's Builder Radar in your agent.")).toBeVisible();
    await expect(page.getByText("npx skills add georgewangyu/george-builder-radar")).toBeHidden();

    await page.getByLabel("Name").fill("Example User");
    await page
      .getByRole("region", { name: "Use George's Builder Radar in your agent." })
      .getByLabel("Email")
      .fill("person@example.com");
    await page.getByRole("button", { name: "Unlock install command" }).click();
    await expect(page.getByRole("link", { name: "Star the repo" })).toHaveAttribute(
      "href",
      "https://github.com/georgewangyu/george-builder-radar",
    );
    await page.getByRole("button", { name: "Copy command" }).click();
    await expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "npx skills add georgewangyu/george-builder-radar --skill george-builder-radar -g",
    );
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
    await expect(page.getByRole("link", { name: new RegExp(feeds[0].date) })).toBeVisible();
    await page.getByRole("link", { name: new RegExp(feeds[0].date) }).click();
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
    await expect(page.getByRole("link", { name: new RegExp(feeds[0].date) })).toBeVisible();
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
    await expect(page.getByRole("heading", { name: "2026-06-30", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "What moved today" })).toBeVisible();
    await expect(page.getByText("Agent systems are becoming operational products")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Repos worth studying" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "`usestrix/strix`" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Original links" })).toBeVisible();
  });
});
