#!/usr/bin/env python3
"""Merge site-diary-unified-workflow and daily-cost-calendar into budget-connected.

Base = 2026-08-14-budget-connected. The two children are inlined as extra .page
divs, their CSS scope-prefixed to the page id, their chrome (sidebar / topbar /
tab bar) stripped, and their colliding globals + element ids renamed.
"""
import os
import re
import sys

ROOT = r"C:\Users\alecn\OneDrive\Desktop\Claude\prototypes"
BASE = os.path.join(ROOT, "2026-08-14-budget-connected", "index.html")
SD = os.path.join(ROOT, "2026-06-02-site-diary-unified-workflow", "index.html")
DC = os.path.join(ROOT, "2026-06-04-daily-cost-calendar", "index.html")
OUT_DIR = os.path.join(ROOT, "2026-08-21-budget-connected-merged")
OUT = os.path.join(OUT_DIR, "index.html")
SHARED = os.path.join(OUT_DIR, "shared-data.js")


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


# ────────────────────────────── CSS scoping ──────────────────────────────

def strip_css_comments(css):
    return re.sub(r"/\*.*?\*/", "", css, flags=re.S)


def split_rules(css):
    """Yield (selector_or_atrule, block_body, is_at_rule) in source order."""
    out, i, n = [], 0, len(css)
    while i < n:
        j = css.find("{", i)
        if j == -1:
            tail = css[i:].strip()
            if tail:
                out.append((tail, None, False))
            break
        sel = css[i:j].strip()
        depth, k = 1, j + 1
        while k < n and depth:
            if css[k] == "{":
                depth += 1
            elif css[k] == "}":
                depth -= 1
            k += 1
        body = css[j + 1:k - 1]
        out.append((sel, body, sel.startswith("@")))
        i = k
    return out


def prefix_selector(sel, scope):
    parts = []
    for raw in sel.split(","):
        s = raw.strip()
        if not s:
            continue
        if s in ("body", "html", ":root", "*"):
            parts.append(scope if s != "*" else scope + " *")
        elif s.startswith("body "):
            parts.append(scope + " " + s[5:])
        elif s.startswith("html "):
            parts.append(scope + " " + s[5:])
        else:
            parts.append(scope + " " + s)
    return ", ".join(parts)


def scope_css(css, scope, kf_prefix):
    css = strip_css_comments(css)
    out = []
    for sel, body, is_at in split_rules(css):
        if body is None:
            continue
        if is_at:
            head = sel.split(None, 1)[0].lower()
            if head in ("@keyframes", "@-webkit-keyframes"):
                name = sel.split(None, 1)[1].strip()
                out.append("%s %s%s{%s}" % (head, kf_prefix, name, body))
            elif head in ("@media", "@supports"):
                out.append("%s{%s}" % (sel, scope_css(body, scope, kf_prefix)))
            else:
                out.append("%s{%s}" % (sel, body))
        else:
            out.append("%s{%s}" % (prefix_selector(sel, scope), body))
    return "\n".join(out)


# ────────────────────────────── HTML surgery ─────────────────────────────

TAG_RE = re.compile(r"<(/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(/?)>", re.S)


def find_element_end(html, start):
    """Given index of the '<' opening an element, return index just past its close."""
    m = TAG_RE.match(html, start)
    if not m:
        raise ValueError("no tag at %d" % start)
    tag = m.group(2).lower()
    if m.group(3) == "/" or tag in ("br", "img", "input", "hr", "meta", "link"):
        return m.end()
    depth, pos = 1, m.end()
    while depth:
        m2 = TAG_RE.search(html, pos)
        if not m2:
            raise ValueError("unbalanced <%s>" % tag)
        if m2.group(2).lower() == tag and m2.group(3) != "/":
            depth += -1 if m2.group(1) else 1
        pos = m2.end()
    return pos


def remove_element(html, anchor, label):
    i = html.find(anchor)
    if i == -1:
        raise SystemExit("FAIL: anchor not found (%s): %s" % (label, anchor))
    end = find_element_end(html, i)
    return html[:i] + html[end:]


def unwrap_element(html, anchor, label):
    """Drop the element's own open/close tags, keep its children."""
    i = html.find(anchor)
    if i == -1:
        raise SystemExit("FAIL: anchor not found (%s): %s" % (label, anchor))
    end = find_element_end(html, i)
    m = TAG_RE.match(html, i)
    inner = html[m.end():end]
    inner = re.sub(r"</[a-zA-Z][a-zA-Z0-9]*>\s*$", "", inner)
    return html[:i] + inner + html[end:]


def section(doc, open_tag, close_tag, label):
    a = doc.find(open_tag)
    b = doc.find(close_tag, a)
    if a == -1 or b == -1:
        raise SystemExit("FAIL: cannot locate %s" % label)
    return doc[a + len(open_tag):b]


def strip_scripts(html):
    """Body content must not carry the child's <script> — it is re-emitted later."""
    out = re.sub(r"<script\b[^>]*>.*?</script>", "", html, flags=re.S | re.I)
    if "<script" in out.lower():
        raise SystemExit("FAIL: leftover <script> in body content")
    return out



OPENERS = {"{": "}", "[": "]", "(": ")"}


def replace_decl(js, decl, new_text, label):
    """Replace a whole `var NAME = <literal>;` declaration, however many lines.

    Matches on the declaration head, then walks brackets to its terminator, so
    a guest rewriting the contents of its own data block does not break this.
    """
    i = js.find(decl)
    if i == -1:
        raise SystemExit("FAIL: declaration not found (%s): %s" % (label, decl))
    j = i + len(decl)
    while j < len(js) and js[j] not in OPENERS:
        j += 1
    if j >= len(js):
        raise SystemExit("FAIL: no literal after %s" % label)
    close, depth, k = OPENERS[js[j]], 1, j + 1
    while k < len(js) and depth:
        c = js[k]
        if c == js[j]:
            depth += 1
        elif c == close:
            depth -= 1
        elif c in "'\"":                       # skip string bodies
            q, k = c, k + 1
            while k < len(js) and js[k] != q:
                k += 2 if js[k] == "\\" else 1
        k += 1
    while k < len(js) and js[k] in " ;\n":
        k += 1
    return js[:i] + new_text + "\n" + js[k:]


def rename_in_handlers(html, pairs):
    """Rename identifiers only inside on*="..." attribute values.

    A blanket rename over the markup would also rewrite class names that happen
    to share a function name (site diary has both a toast() and a .toast).
    """
    def sub(m):
        return m.group(1) + rename_all(m.group(2), pairs) + '"'
    return re.sub(r'(on[a-z]+=")([^"]*)"', sub, html)


def rename_all(text, pairs):
    for old, new in pairs:
        text = re.sub(r"\b%s\b" % re.escape(old), new, text)
    return text


# ────────────────────────────── build children ───────────────────────────

def build_site_diary():
    doc = read(SD)
    css = section(doc, "<style>", "</style>", "SD css")
    js = section(doc, "<script>", "</script>", "SD js")
    html = strip_scripts(section(doc, "<body>", "</body>", "SD body"))

    html = remove_element(html, '<div class="topbar">', "SD topbar")
    html = remove_element(html, '<div class="proj-tabs">', "SD proj-tabs")
    html = html.replace("<!-- Top header -->", "").replace("<!-- Project tabs -->", "")
    # the diary's date is set from the ledger, so it needs a handle
    if "02/06/2026" not in html:
        raise SystemExit("FAIL: SD date display not found")
    html = html.replace("02/06/2026", '<span id="sdDiaryDate">02/06/2026</span>', 1)

    ids = [("toastTxt", "sdToastTxt"), ("toast", "sdToastEl"),
           ("stepper", "sdStepper"), ("drawer", "sdDrawer")]
    fns = [("money", "sdMoney"), ("toast", "sdToast"), ("fmt", "sdFmt"),
           ("openDrawer", "sdOpenDrawer"), ("closeDrawer", "sdCloseDrawer")]

    # ids first in HTML (attribute values), then function names in handlers
    html = re.sub(r'id="toastTxt"', 'id="sdToastTxt"', html)
    html = re.sub(r'id="toast"', 'id="sdToastEl"', html)
    html = re.sub(r'id="stepper"', 'id="sdStepper"', html)
    html = re.sub(r'id="drawer"', 'id="sdDrawer"', html)
    html = rename_in_handlers(html, fns)

    # JS: getElementById string literals, then identifiers
    for old, new in ids:
        js = js.replace("getElementById('%s')" % old, "getElementById('%s')" % new)
        js = js.replace('getElementById("%s")' % old, 'getElementById("%s")' % new)
        js = js.replace("querySelector('#%s" % old, "querySelector('#%s" % new)
    js = rename_all(js, fns)

    # The diary's seeded arrays give way to the shared dataset.
    js = replace_decl(js, "var WBS=", "var WBS=[];", "SD WBS")
    js = replace_decl(js, "var COSTCENTRES=", "var COSTCENTRES=[];", "SD COSTCENTRES")
    js = replace_decl(js, "var WORKERS=", "var WORKERS=[];", "SD WORKERS")
    js = replace_decl(js, "var PLANTITEMS=", "var PLANTITEMS=[];", "SD PLANTITEMS")
    js = replace_decl(js, "var ALLOC_OPTIONS=", "var ALLOC_OPTIONS=[];", "SD ALLOC_OPTIONS")
    js = replace_decl(js, "var rows=",
                      "var rows={labour:[],plant:[],materials:[],misc:[],"
                      "miscEntries:[],deliveries:[],dockets:[]};", "SD rows")
    # setMode('wbs') at the foot of the guest script would render the empty
    # arrays; the sync does it instead, once there is data.
    old_init = "/* init */\nsetMode('wbs');"
    if old_init not in js:
        raise SystemExit("FAIL: SD init not found")
    js = js.replace(old_init, "/* init runs from sdSyncData once VDATA has built the day */")
    js += SD_SYNC

    css = scope_css(css, "#pageSiteDiary", "sd_")
    css += """
/* merge shims — site diary */
#pageSiteDiary{background:#eef0f4;margin:0 -24px -24px;padding-bottom:24px}
"""
    return css, html, js


def build_daily_cost():
    doc = read(DC)
    css = section(doc, "<style>", "</style>", "DC css")
    js = section(doc, "<script>", "</script>", "DC js")
    html = strip_scripts(section(doc, "<body>", "</body>", "DC body"))

    html = remove_element(html, '<div class="sidebar">', "DC sidebar")
    html = remove_element(html, '<div class="proj-header">', "DC proj-header")
    html = remove_element(html, '<div class="tabs">', "DC tabs")

    html = re.sub(r'id="drawer"', 'id="dcDrawer"', html)
    html = re.sub(r'id="drawerOverlay"', 'id="dcDrawerOverlay"', html)
    fns = [("fmt", "dcFmt"), ("openDrawer", "dcOpenDrawer"),
           ("closeDrawer", "dcCloseDrawer")]
    html = rename_in_handlers(html, fns)

    for old, new in [("drawer", "dcDrawer"), ("drawerOverlay", "dcDrawerOverlay")]:
        js = js.replace("getElementById('%s')" % old, "getElementById('%s')" % new)
        js = js.replace('getElementById("%s")' % old, 'getElementById("%s")' % new)
    js = rename_all(js, fns)

    # The calendar's own month of mock data gives way to the shared ledger.
    js = replace_decl(js, "const DATA =", "let DATA = {};", "DC DATA")
    js = replace_decl(js, "let viewYear =",
                      "let viewYear = 2026, viewMonth = 5;  /* set from the ledger period */",
                      "DC viewMonth")
    old_today = "function goToday() { viewYear = 2026; viewMonth = 5; renderCalendar(); }"
    if old_today not in js:
        raise SystemExit("FAIL: DC goToday not found")
    js = js.replace(old_today,
                    "function goToday() { dcSyncData(); }")
    js += DC_SYNC

    css = scope_css(css, "#pageDailyCost", "dc_")
    css += """
/* merge shims — daily cost tracking */
#pageDailyCost{background:#f3f4f6;margin:0 -24px -24px;padding-bottom:24px}
#pageDailyCost .layout{min-height:0}
#pageDailyCost .main{margin-left:0;overflow:visible}
#pageDailyCost .content{overflow:visible;padding:18px 24px 24px}
"""
    return css, html, js


# ────────────────────────────── assemble ─────────────────────────────────

TAB_BAR_NEW = '''    <div class="budget-view-tabs">
      <span class="bv-tab"><i class="fas fa-chevron-left" style="margin-right:4px"></i> Dashboard</span>
      <span class="bv-tab active" onclick="gotoTab(this,'pageOverview')">Budget Overview</span>
      <span class="bv-tab" onclick="gotoTab(this,'pageDailyCost')">Daily Cost Tracking</span>
      <span class="bv-tab">Claim</span>
      <span class="bv-tab">Variation Register</span>
      <span class="bv-tab">Report</span>
      <span class="bv-tab">File Manager</span>
      <span class="bv-tab" onclick="gotoTab(this,'pageSiteDiary')">Site Diary</span>
      <span class="bv-tab">Daywork Docket</span>
    </div>'''

DC_SYNC = """

/* ── shared dataset ──────────────────────────────────────────────────────
   The calendar is a view of the budget's cost for the open claim period, not
   a dataset of its own. Re-derive whenever the budget has moved. */
var _dcVersion = -1;
function dcSyncData() {
  var p = VDATA.period();
  viewYear  = parseInt(p.start.slice(0, 4), 10);
  viewMonth = parseInt(p.start.slice(5, 7), 10) - 1;
  DATA = vdataCalendarData();
  var badge = document.querySelector('#pageDailyCost .subtab .badge');
  if (badge) badge.textContent = (typeof unassignedDocs !== 'undefined') ? unassignedDocs.length : 0;
  renderCalendar();
  _dcVersion = VDATA.version();
}
function dcSyncIfStale() { if (_dcVersion !== VDATA.version()) dcSyncData(); }
"""

SD_SYNC = """

/* ── shared dataset ──────────────────────────────────────────────────────
   The diary records one day of the same ledger the calendar shows. Its own
   in-session edits (dockets added, materials amended) are kept, so this only
   rebuilds when the budget underneath has actually changed. */
var _sdVersion = -1;
function sdSyncData() {
  WBS           = VDATA.wbsTree();
  COSTCENTRES   = VDATA.costCentres().map(function (n) { return {c: VDATA.ccCode(n), n: n}; });
  WORKERS       = VDATA.workers();
  PLANTITEMS    = VDATA.plant();
  ALLOC_OPTIONS = VDATA.allocOptions();
  rows          = vdataDiaryRows();
  var lbl = document.getElementById('sdDiaryDate');
  if (lbl) lbl.textContent = vdataDiaryDateLabel();
  setMode(MODE);
  _sdVersion = VDATA.version();
}
function sdSyncIfStale() { if (_sdVersion !== VDATA.version()) sdSyncData(); }
"""

MERGE_JS = '''
/* ══════════════════════════════════════════════════════════════
   MERGE LAYER — tab routing across the three merged prototypes

   The base app owns pages 1..pageOverview and drives the wizard
   chrome from setWizChrome(). The two merged prototypes are extra
   pages that have no wizard, so while one is open we stand the
   wizard chrome down and stop setWizChrome() from reclaiming the
   tab highlight.
   ══════════════════════════════════════════════════════════════ */
var GUEST_PAGES = { pageDailyCost: 1, pageSiteDiary: 1 };
var IN_GUEST = false;

var _baseShowPage = showPage;
var _baseSetWizChrome = setWizChrome;

showPage = function(id) {
  if (!GUEST_PAGES[id]) {
    IN_GUEST = false;
    var wb = document.getElementById('wizBar');
    if (wb) wb.style.display = '';
  }
  _baseShowPage(id);
};

setWizChrome = function(inWizard) {
  if (IN_GUEST) return;          /* no wizard on a merged page */
  _baseSetWizChrome(inWizard);
};

/* The budget moving is the only thing that can stale the guest datasets, and
   every path that moves it ends in render(). */
var _baseRender = render;
render = function() {
  _baseRender.apply(null, arguments);
  VDATA.refreshIfChanged();
};

function gotoTab(el, pageId) {
  IN_GUEST = !!GUEST_PAGES[pageId];
  document.querySelectorAll('.budget-view-tabs .bv-tab').forEach(function(t) {
    t.classList.toggle('active', t === el);
  });
  if (IN_GUEST) {
    var wb = document.getElementById('wizBar');
    var st = document.getElementById('stepper');
    if (wb) wb.style.display = 'none';
    if (st) st.style.display = 'none';
  }
  showPage(pageId);
  if (pageId === 'pageDailyCost') dcSyncIfStale();
  if (pageId === 'pageSiteDiary') sdSyncIfStale();
}
'''


def main():
    base = read(BASE)
    sd_css, sd_html, sd_js = build_site_diary()
    dc_css, dc_html, dc_js = build_daily_cost()

    # 1. tab bar
    old_bar_start = base.find('    <div class="budget-view-tabs">')
    if old_bar_start == -1:
        raise SystemExit("FAIL: tab bar not found")
    old_bar_end = find_element_end(base, base.find("<div", old_bar_start))
    base = base[:old_bar_start] + TAB_BAR_NEW + base[old_bar_end:]

    # 2. child CSS before </head>
    style_block = ("\n<style>\n/* ═══ merged: daily cost tracking ═══ */\n" + dc_css +
                   "\n/* ═══ merged: site diary ═══ */\n" + sd_css + "\n</style>\n")
    base = base.replace("</head>", style_block + "</head>", 1)

    # 3. child pages after the stepper div
    anchor = '<div class="stepper" id="stepper"></div>'
    if anchor not in base:
        raise SystemExit("FAIL: stepper anchor not found")
    pages = (anchor +
             '\n\n    <!-- ════ MERGED PAGE: Daily Cost Tracking ════ -->\n'
             '    <div class="page" id="pageDailyCost">\n' + dc_html +
             '\n    </div>\n\n'
             '    <!-- ════ MERGED PAGE: Site Diary ════ -->\n'
             '    <div class="page" id="pageSiteDiary">\n' + sd_html +
             '\n    </div>\n')
    base = base.replace(anchor, pages, 1)

    # 5. scripts before </body>
    scripts = ("\n<script>" + MERGE_JS + "</script>\n"
               "\n<!-- ═══ merged script: daily cost tracking ═══ -->\n<script>\n"
               + dc_js + "\n</script>\n"
               "\n<!-- ═══ merged script: site diary ═══ -->\n<script>\n"
               + sd_js + "\n</script>\n")
    base = base.replace("</body>", scripts + "</body>", 1)

    os.makedirs(OUT_DIR, exist_ok=True)
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write(base)
    print("wrote %s (%d bytes)" % (OUT, len(base)))


if __name__ == "__main__":
    main()
