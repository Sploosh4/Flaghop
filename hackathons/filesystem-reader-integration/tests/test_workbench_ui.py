"""Exercise the installed component against the real neutral SSH reader lab.

Chrome is headless, uses a separate profile, and has no desktop display variables.
No fixtures or source files are created/modified by this check. One synthetic
completion notification is dismissed; its underlying result is retained.
"""
from pathlib import Path
import hashlib
import json
import os
import time
import urllib.request

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import Select, WebDriverWait

ROOT = Path(__file__).resolve().parents[1]
LEGION = Path('/home/joshua/Projects/legion')
LAB = LEGION/'.tmp/workspace-primitives-ui'
OUT = LEGION/'.artifacts/disposable/workspace-primitives-ui'
URL = 'http://127.0.0.1:32965/'
RESULTS = []


def status():
    with urllib.request.urlopen(URL+'api/status', timeout=10) as response:
        return json.load(response)


def check(name, truth):
    if not truth:
        raise AssertionError(name)
    RESULTS.append(name)
    print(name, flush=True)


def main():
    for name in ('DISPLAY', 'WAYLAND_DISPLAY'):
        os.environ.pop(name, None)
    LAB.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    os.environ['TMPDIR'] = str(LAB)
    os.environ['XDG_CACHE_HOME'] = str(LAB/'cache')
    os.environ['XDG_CONFIG_HOME'] = str(LAB/'config')
    original_running = status()['running']
    options = webdriver.ChromeOptions()
    options.binary_location = '/usr/bin/google-chrome'
    for arg in ['--headless=new', '--ozone-platform=headless', '--user-data-dir='+str(LAB/'profile'),
                '--disable-background-networking', '--disable-sync', '--no-first-run', '--no-default-browser-check',
                '--disable-gpu', '--disable-dev-shm-usage', '--window-size=1200,900']:
        options.add_argument(arg)
    options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
    driver = webdriver.Chrome(service=Service(str(LEGION/'.tmp/native-editor-lab/chromedriver-linux64/chromedriver')), options=options)
    wait = WebDriverWait(driver, 20)
    js = driver.execute_script
    try:
        driver.get(URL)
        wait.until(lambda _: js('return !!globalThis.flagMapWorkspace'))
        check('Workspace primitives mount against the real reader API', js('return !!flagMapWorkspace.controller.view().status'))
        check('Workspace label comes from the actual project', js('return document.getElementById("reader-workspace-title").textContent') == Path(status()['project']).name)
        driver.find_element('id', 'reader-panel-toggle').click()
        check('Working is tucked into a collapsed section', not driver.find_element('id', 'reader-working-group').get_attribute('open'))
        wait.until(lambda _: not driver.find_element('id', 'reader-toggle').get_attribute('disabled'))
        js('return flagMapWorkspace.controller.setRunning(false)')
        check('Pause is committed for this workspace', status()['running'] is False)
        check('Requested pause is not falsely presented as observed worker completion', js('return document.getElementById("reader-workspace-state").textContent') in ('Pause requested', 'Pausing', 'Paused'))
        requested_id = js('return flagMapWorkspace.workspaceId')
        active_alerts = js('return flagMapWorkspace.controller.view().status.alerts')
        check('Real saved artifacts populate the alert list', len(active_alerts) > 0)
        check('Alerts are newest first', [a['completed'] for a in active_alerts] == sorted([a['completed'] for a in active_alerts], reverse=True))
        check('Newest alert is first in the panel', driver.find_element('css selector', '.reader-alert').get_attribute('data-alert-id') == active_alerts[0]['id'])
        first = active_alerts[0]
        output = Path(status()['project'])/first['result_path']
        before = hashlib.sha256(output.read_bytes()).hexdigest()
        driver.find_element('css selector', '.open-result').click()
        wait.until(lambda _: js('return !document.getElementById("text-editor").hidden'))
        check('Alert opens the actual saved filename in the tabbed editor', js('return currentEditor().entry.name') == output.name)
        check('Derived tab is scoped to its workspace', requested_id in js('return decodeURIComponent(currentEditor().entry.path)'))
        check('Derived tab shows its actual project/tool path', first['result_path'] in driver.find_element('id', 'editor-path').text)
        check('Original provenance is retained on open', first['origins'][0]['path'] in driver.find_element('id', 'editor-state').text)
        check('Start/Pause remains visible while the editor is open', js('const r=document.getElementById("reader-toggle").getBoundingClientRect();return r.top>=0&&r.bottom<64&&document.elementFromPoint(r.x+5,r.y+5).id==="reader-toggle"'))
        driver.save_screenshot(str(OUT/'editor-result.png'))
        driver.find_element('id', 'reader-panel-toggle').click()
        driver.find_element('css selector', '.reader-alert button[aria-label^="Dismiss result alert"]').click()
        wait.until(lambda _: first['id'] not in js('return flagMapWorkspace.controller.view().status.alerts.map(a=>a.id)'))
        check('Dismiss hides the notification and retains output bytes', output.is_file() and hashlib.sha256(output.read_bytes()).hexdigest() == before)
        driver.refresh()
        wait.until(lambda _: js('return !!globalThis.flagMapWorkspace'))
        check('Pause survives page reload', js('return flagMapWorkspace.controller.view().status.running') is False)
        check('Dismissal survives page reload', first['id'] not in js('return flagMapWorkspace.controller.view().status.alerts.map(a=>a.id)'))
        # Switch filesystem source, not workspace. No implicit start on navigation.
        Select(driver.find_element('id', 'reader-source')).select_by_value('original-demo')
        wait.until(lambda _: js('return !!globalThis.flagMapWorkspace') and 'original-demo' in driver.current_url)
        wait.until(lambda _: len(driver.find_elements('css selector', '.entry[data-name="normal.txt"]')) == 1)
        check('Changing filesystem view preserves workspace identity and pause', js('return flagMapWorkspace.workspaceId') == requested_id and status()['running'] is False)
        entry = driver.find_element('css selector', '.entry[data-name="normal.txt"]')
        ActionChains(driver).double_click(entry).perform()
        wait.until(lambda _: js('return typeof currentEditor === "function" && currentEditor()?.entry.name==="normal.txt"'))
        check('Original file double-click/editor behaviour is preserved', js('return currentEditor().area.value') == "preview for 'normal.txt'\n")
        check('Interactive file browsing does not resume background jobs', status()['running'] is False)
        driver.find_element('id', 'reader-panel-toggle').click()
        driver.save_screenshot(str(OUT/'working-alerts.png'))
        check('Working stays visible even with a long alert list', js('const r=document.getElementById("reader-working-group").getBoundingClientRect();return r.top>=0&&r.bottom<innerHeight'))
        check('Alerts have their own scrolling area', js('const r=document.getElementById("reader-alerts");return getComputedStyle(r).overflowY==="auto"'))
        time.sleep(3)
        check('Polling preserves the collapsed Working section', not driver.find_element('id', 'reader-working-group').get_attribute('open'))
        check('Resume uses the real workspace control', js('return flagMapWorkspace.controller.setRunning(true)') is True and status()['running'] is True)
        check('Pause retains snapshots and saved results', js('return flagMapWorkspace.controller.setRunning(false)') is True and output.is_file())
        errors = [e for e in driver.get_log('browser') if e['level'] == 'SEVERE' and 'favicon.ico' not in e['message']]
        check('No JavaScript errors', not errors)
    finally:
        try:
            js('return flagMapWorkspace.controller.setRunning(arguments[0])', original_running)
        finally:
            driver.quit()
        result = {'passed': len(RESULTS), 'checks': RESULTS, 'restored_initial_running_state': status()['running'] == original_running,
                  'browser': 'Chrome 156 headless; DISPLAY/WAYLAND_DISPLAY removed', 'screenshots': str(OUT)}
        (ROOT/'validation'/'browser-results.json').write_text(json.dumps(result, indent=2)+'\n')
    print(json.dumps({'passed': len(RESULTS), 'restored_initial_running_state': status()['running'] == original_running}), flush=True)


if __name__ == '__main__':
    main()
