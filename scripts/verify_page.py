"""Optional browser checks. Requires Playwright and a locally installed Chrome.

Run a local HTTP server first, then:
  python scripts/verify_page.py --url http://127.0.0.1:8000
The website itself has no Python or Playwright dependency.
"""
import argparse
import asyncio
import json
from pathlib import Path

from playwright.async_api import async_playwright


async def verify(args):
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    checks = []
    errors = []
    failed_requests = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            executable_path=args.chrome,
            headless=True,
            args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
        )
        context = await browser.new_context(viewport={'width': 1440, 'height': 1080}, device_scale_factor=1, reduced_motion='reduce')
        await context.grant_permissions(['clipboard-read', 'clipboard-write'])
        page = await context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda response: failed_requests.append(f'{response.status} {response.url}') if response.status >= 400 else None)
        await page.goto(args.url, wait_until='networkidle')
        await page.evaluate('document.fonts.ready')
        assert await page.title() == 'Grounding Driving VLA via Inverse Kinematics'
        assert await page.locator('#example-delta').inner_text() == '−10.57 m'
        assert await page.locator('#mean-delta').inner_text() == '−1.04 m'
        assert await page.locator('#trajectory-chart polyline').count() == 2
        checks.append('Initial paper metadata and actual saved trajectory values')

        for scene in ['0', '1']:
            await page.select_option('#scene-select', scene)
            for variant in ['Near', 'Far', 'VeryFar', 'Sky', 'SkyFar']:
                await page.click(f'[data-variant="{variant}"]')
                assert await page.locator(f'[data-variant="{variant}"]').get_attribute('aria-pressed') == 'true'
                await page.wait_for_function("document.querySelector('#scene-after').complete && document.querySelector('#scene-after').naturalWidth > 0")
                assert await page.locator('#trajectory-chart circle').count() == 14
        await page.select_option('#scene-select', '1')
        await page.click('[data-variant="Near"]')
        assert await page.locator('#example-delta').inner_text() == '−17.15 m'
        await page.locator('#comparison-range').fill('75')
        assert '75 percent original' in await page.locator('#comparison-range').get_attribute('aria-valuetext')
        assert await page.locator('#image-comparison').evaluate("element => element.style.getPropertyValue('--split')") == '75%'
        checks.append('All 10 scene/placement combinations, saved waypoints, image loading, and comparison slider')

        await page.click('#tab-v2')
        assert await page.locator('#panel-v2').is_visible()
        assert not await page.locator('#panel-v1').is_visible()
        assert await page.locator('#panel-v2 .ours .chart-value').inner_text() == '90.6'
        await page.locator('#tab-v2').press('ArrowRight')
        assert await page.locator('#panel-nuscenes').is_visible()
        assert await page.locator('#panel-nuscenes .ours .chart-value').inner_text() == '0.06'
        await page.locator('#tab-nuscenes').press('Home')
        assert await page.locator('#tab-v1').get_attribute('aria-selected') == 'true'
        checks.append('Benchmark values, tab selection, and keyboard navigation')

        for key, duration in [('driving', 40), ('counterfactual', 36), ('overview', 162)]:
            await page.click(f'[data-video="{key}"]')
            await page.evaluate("document.querySelector('video').load()")
            await page.wait_for_function("document.querySelector('video').readyState >= 2", timeout=20000)
            assert abs(await page.evaluate("document.querySelector('video').duration") - duration) < 1
            assert await page.locator('#video-download').get_attribute('href') == f'assets/media/{key}.mp4'
            await page.evaluate("document.querySelector('video').play()")
            await page.wait_for_function("document.querySelector('video').currentTime > 0.1")
            await page.evaluate("document.querySelector('video').pause()")
            await page.wait_for_function("document.querySelector('video track').readyState === 2", timeout=10000)
        checks.append('All three videos decode/play with the expected duration and load English caption tracks')

        await page.click('#copy-citation')
        clipboard = await page.evaluate('navigator.clipboard.readText()')
        assert '@misc{park2026grounding' in clipboard and 'Park, Junsung and Shim, Hyunjung' in clipboard
        checks.append('BibTeX clipboard copy')

        await page.select_option('#scene-select', '0')
        await page.click('[data-variant="Near"]')
        await page.locator('#comparison-range').fill('45')
        await page.goto(args.url, wait_until='networkidle')
        await page.evaluate('document.fonts.ready')
        for width in [1440, 1024, 768, 390, 375, 320]:
            await page.set_viewport_size({'width': width, 'height': 1000})
            await page.evaluate("document.activeElement.blur(); window.scrollTo({top: 0, behavior: 'instant'})")
            await page.wait_for_timeout(150)
            overflow = await page.evaluate('document.documentElement.scrollWidth > window.innerWidth')
            assert not overflow, f'Horizontal overflow at {width}px'
            if width in [1440, 390]:
                # Trigger deferred figure loads before the full-page capture.
                await page.locator('#citation').scroll_into_view_if_needed()
                await page.wait_for_timeout(350)
                await page.evaluate("document.activeElement.blur(); window.scrollTo({top: 0, behavior: 'instant'})")
                await page.wait_for_function('window.scrollY === 0')
                await page.screenshot(path=str(output / f'page-{width}.png'), full_page=True)
                await page.screenshot(path=str(output / f'hero-{width}.png'))
        checks.append('No horizontal overflow at 320, 375, 390, 768, 1024, and 1440 px; desktop/mobile screenshots')
        broken = await page.locator('img').evaluate_all('(images) => images.filter(image => image.complete && !image.naturalWidth).map(image => image.src)')
        assert not broken, broken
        assert not errors, errors
        assert not failed_requests, failed_requests
        checks.append('No browser JavaScript errors, HTTP errors, or broken loaded images')

        await context.close()
        nojs = await browser.new_context(java_script_enabled=False)
        static = await nojs.new_page()
        await static.goto(args.url, wait_until='networkidle')
        assert await static.locator('h1').is_visible()
        await static.locator('.results-table-details summary').click()
        assert await static.locator('.ours-row').is_visible()
        checks.append('Without JavaScript, paper content and the numerical table remain accessible')
        await nojs.close()
        await browser.close()
    result = {'passed': True, 'checks': checks, 'console_errors': errors, 'http_errors': failed_requests}
    (output / 'verification.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', default='http://127.0.0.1:8000')
    parser.add_argument('--chrome', default='/usr/bin/google-chrome')
    parser.add_argument('--output', default='/tmp/driving-vla-page-verification')
    asyncio.run(verify(parser.parse_args()))
