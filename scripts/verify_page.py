"""Optional browser verification for the static NTN template.

Requires Playwright and Chrome; the website itself has no build dependencies.
Start a local HTTP server, then run:
    python scripts/verify_page.py --url http://127.0.0.1:8000
"""
import argparse
import asyncio
import json
from pathlib import Path

from playwright.async_api import async_playwright


async def verify(args):
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    errors, failures, external_requests, checks = [], [], [], []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            executable_path=args.chrome, headless=True,
            args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
        )
        context = await browser.new_context(
            viewport={'width': 1440, 'height': 1000}, device_scale_factor=1,
            reduced_motion='reduce', permissions=['clipboard-read', 'clipboard-write'],
        )
        page = await context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda r: failures.append(f'{r.status}: {r.url}') if r.status >= 400 else None)
        page.on('request', lambda r: external_requests.append(r.url) if not r.url.startswith(args.url.rstrip('/') + '/') else None)
        await page.goto(args.url, wait_until='networkidle')
        await page.evaluate('document.fonts.ready')
        assert await page.locator('h1').inner_text() == 'Grounding Driving VLA\nvia Inverse Kinematics'
        assert await page.locator('table').count() == 3
        assert '92.2' in await page.locator('#navsim-table .ours-row').inner_text()
        assert '90.6' in await page.locator('#navsim-table .ours-row').inner_text()
        assert await page.locator('#nuscenes-table .ours-row td').all_text_contents() == ['0.04', '0.06', '0.10', '0.06']
        assert '−1.04 m' in await page.locator('#intervention-table .ours-row').inner_text()
        checks.append('Title, three HTML tables, and key paper metrics')

        # Check every local link/resource, including links not loaded by the initial render.
        references = await page.evaluate("""() => [...document.querySelectorAll('[href], [src], [poster]')]
          .flatMap(el => ['href', 'src', 'poster'].map(attr => el.getAttribute(attr)).filter(Boolean))""")
        for ref in set(references):
            if ref.startswith('#'):
                assert await page.locator(ref).count() == 1, ref
            elif not ref.startswith(('https:', 'http:', 'mailto:', 'data:')):
                response = await context.request.head(args.url.rstrip('/') + '/' + ref)
                assert response.ok, f'{ref}: {response.status}'
        checks.append('All section anchors, images, font/style/script links, PDF, videos, and captions resolve')

        for key, duration in [('overview', 162), ('driving', 40), ('counterfactual', 36)]:
            selector = f'#{key}-video'
            await page.locator(selector).scroll_into_view_if_needed()
            await page.locator(selector).evaluate('(video) => video.load()')
            await page.wait_for_function('(id) => document.getElementById(id).readyState >= 2', arg=f'{key}-video', timeout=20000)
            actual = await page.locator(selector).evaluate('(video) => video.duration')
            assert abs(actual - duration) < 1, (key, actual)
            await page.locator(selector).evaluate('(video) => video.play()')
            await page.wait_for_function('(id) => document.getElementById(id).currentTime > 0.1', arg=f'{key}-video')
            await page.locator(selector).evaluate('(video) => video.pause()')
            await page.wait_for_function('(id) => document.getElementById(id).querySelector("track").readyState === 2', arg=f'{key}-video')
        checks.append('Three independent native videos play and load English captions')

        await page.click('#copy-bibtex')
        clipboard = await page.evaluate('navigator.clipboard.readText()')
        assert clipboard == await page.locator('#bibtex-code').text_content()
        checks.append('BibTeX clipboard copy reads the editable HTML citation')

        await page.reload(wait_until='networkidle')
        for width in [1440, 1024, 768, 390, 375, 320]:
            await page.set_viewport_size({'width': width, 'height': 1000})
            assert not await page.evaluate('document.documentElement.scrollWidth > innerWidth'), width
            if width in [1440, 390]:
                # Load figures that are below the fold before taking screenshots.
                for img in await page.locator('img').all():
                    await img.scroll_into_view_if_needed()
                    await img.evaluate('(img) => img.decode()')
                await page.evaluate('document.activeElement.blur(); window.scrollTo(0, 0)')
                await page.evaluate('document.fonts.ready')
                await page.screenshot(path=str(output / f'page-{width}.png'), full_page=True)
                await page.screenshot(path=str(output / f'hero-{width}.png'))
        checks.append('No page overflow at six viewport widths, including 320 px; desktop/mobile screenshots')
        assert not errors, errors
        assert not failures, failures
        assert not external_requests, external_requests
        checks.append('No JavaScript errors, HTTP errors, or external runtime dependencies')
        await context.close()

        # Ease of editing is the main requirement: no JS-generated paper content.
        nojs = await browser.new_context(java_script_enabled=False, viewport={'width': 390, 'height': 900})
        page = await nojs.new_page()
        await page.goto(args.url, wait_until='networkidle')
        assert await page.locator('#abstract').is_visible()
        for table_id in ['navsim-table', 'nuscenes-table', 'intervention-table']:
            assert await page.locator(f'#{table_id}').is_visible()
        assert await page.locator('video[controls]').count() == 3
        assert await page.locator('#copy-bibtex').is_hidden()
        assert not await page.evaluate('document.documentElement.scrollWidth > innerWidth')
        checks.append('All content, results, and native video controls are available with JavaScript disabled')
        await nojs.close()
        await browser.close()

    result = {'passed': True, 'template': 'NTN / Academic Project Page Template', 'checks': checks,
              'console_errors': errors, 'http_errors': failures, 'external_requests': external_requests}
    (output / 'verification.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', default='http://127.0.0.1:8000')
    parser.add_argument('--chrome', default='/usr/bin/google-chrome')
    parser.add_argument('--output', default='/tmp/driveik-ntn-verification')
    asyncio.run(verify(parser.parse_args()))
