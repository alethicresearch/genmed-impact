"""Cross-view links must work in every shell that embeds the analysis views.

The views are shared by the original research page and by the story pages, and each shell keys
the active view on a different URL parameter. A view that writes the parameter itself works in
whichever shell it was written for and is silently dead everywhere else — which is exactly what
happened once. These tests pin the contract instead of the symptom.
"""
from __future__ import annotations

import re
from pathlib import Path

import pytest

APP = Path(__file__).resolve().parents[2] / "app" / "src"
VIEWS = sorted((APP / "views").glob("*.tsx"))
# Shells that embed the analysis views and therefore must supply a navigator.
SHELLS = ["v3/AppV3.tsx", "v4/AppV4.tsx", "v5/AppV5.tsx", "v6/AppV6.tsx", "v8/AppV8.tsx"]
# v7 mirrors the research page: tab routing via viewNav's documented fallback.


def test_views_exist():
    assert VIEWS, "no analysis views found — check the path"


def test_no_view_writes_a_routing_key_itself():
    """A view cannot know which shell it is inside, so it must not choose the routing key."""
    offenders = []
    for path in VIEWS:
        for key in ("tab:", "deep:", "open:"):
            if re.search(r"update\(\{\s*" + key, path.read_text()):
                offenders.append(f"{path.name} writes {key}")
    assert not offenders, (
        "use the navigator from viewNav instead of writing a routing key: " + "; ".join(offenders))


def test_every_shell_supplies_a_navigator():
    """Except the original page, which documents its reliance on the tab-routing fallback."""
    for shell in SHELLS:
        src = (APP / shell).read_text()
        assert "ViewNavProvider" in src, f"{shell} embeds views but supplies no navigator"

    app = (APP / "App.tsx").read_text()
    assert "ViewNavProvider" not in app, (
        "App.tsx is expected to use the documented tab-routing fallback; if that changed, "
        "update this test and viewNav's docstring together")
    assert "tab: id" in (APP / "viewNav.tsx").read_text(), "the fallback must still route on tab"


def _link_targets() -> set[str]:
    targets: set[str] = set()
    for path in VIEWS:
        targets |= set(re.findall(r"\bgo\('([a-z-]+)'", path.read_text()))
    return targets


def test_links_are_actually_used():
    assert len(_link_targets()) >= 5, "expected the views to cross-link to each other"


@pytest.mark.parametrize("shell", SHELLS + ["App.tsx", "v7/AppV7.tsx"])
def test_every_link_target_is_renderable_in_every_shell(shell):
    """A link to a view the shell cannot render is a dead link, however it is routed."""
    src = (APP / shell).read_text()
    # Each shell dispatches on the view id somewhere in its AnalysisView equivalent.
    renderable = set(re.findall(r"id === '([a-z-]+)'", src)) | set(
        re.findall(r"activeView === '([a-z-]+)'", src))
    if not renderable:
        pytest.skip(f"{shell} does not dispatch by view id")
    missing = sorted(t for t in _link_targets() if t not in renderable)
    assert not missing, f"{shell} cannot render linked view(s): {missing}"
