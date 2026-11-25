import { expect, test } from '@playwright/test';

test('guests can open the birthday itinerary and find the archive', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1, name: 'Sydney’s 30th Birthday on the Nile' })).toBeVisible();

  await page.getByRole('link', { name: /Thu, Jan 14.*Sydney’s 30th birthday/ }).click();
  const birthday = page.locator('#day-2027-01-14');
  await expect(birthday).toBeFocused();
  await expect(birthday).toContainText('Sydney’s 30th birthday');
  const postcard = birthday.locator('img');
  await expect.poll(() => postcard.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await page.reload();
  await expect(birthday).toBeInViewport();

  await page.getByRole('link', { name: /Trip details/ }).click();
  await expect(page.locator('#trip-details')).toBeFocused();
  await expect(page).toHaveURL(/itinerary\/#trip-details$/);
  await page.getByRole('link', { name: 'Learn About Ancient Egypt' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'The Living Archive' })).toBeVisible();
  await page.getByRole('link', { name: 'Browse the encyclopedia' }).click();
  await expect(page).toHaveURL(/wiki\/$/);
  await page.getByRole('banner').getByRole('link', { name: 'Back to trip' }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Sydney’s 30th Birthday/ })).toBeVisible();
});

test.describe('itinerary without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the static page includes the birthday and departure day', async ({ page }) => {
    await page.goto('itinerary/');
    await expect(page.getByRole('heading', { level: 1, name: 'Itinerary' })).toBeVisible();
    await expect(page.locator('#day-2027-01-14')).toContainText('Sydney’s 30th birthday');
    await expect(page.locator('#day-2027-01-15')).toContainText('noon flight to Cairo');
    await page.goto('trip-details/');
    await expect(page).toHaveURL(/itinerary\/#trip-details$/);
    await expect(page.locator('#trip-details')).toContainText('Request a kayak');
  });
});
