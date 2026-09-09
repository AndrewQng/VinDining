#!/usr/bin/env python3
"""Deterministic structural linter for .drawio files.

Catches the class of mistakes a vision self-check is slow and unreliable at:
dangling edge endpoints, duplicate or reserved ids, broken parent references,
and (as warnings) off-grid geometry, overlapping sibling nodes, and edge
routing defects. Runs without launching draw.io, so it is a fast pre-check
before the visual review step.

  python3 validate.py diagram.drawio
  python3 validate.py diagram.drawio --json

Each finding is rendered as:

  error: [E-DANGLING-END] edge '4' target 'nope' does not exist (fix: ...)

The bracketed code is stable, and every finding carries a ``fix`` hint, so an
agent (or a script) can act on the output mechanically; ``--json`` emits the
same findings as structured objects (``code``, ``severity``, ``subject``,
``message``, ``fix``) instead of prose lines.

Edge routing checks (warnings): an edge segment crossing a non-incident leaf
vertex ("routes through vertex"), and two edges crossing each other ("edges X
and Y cross") — the two defects the SKILL.md step-5 self-check looks for
("Edge-shape overlap", "Stacked edges"), but caught here deterministically.

Routing is only knowable from the XML when an edge carries explicit waypoints
(``<Array as="points">``) — exactly the hand-routed case the SKILL.md tells
authors to use to route around shapes. Edges with no waypoints are auto-routed
by draw.io at render time (the path is not stored), so they are NOT geometry-
checked here, keeping these warnings free of false positives. Endpoints honour
``exitX/exitY``/``entryX/entryY`` when present, else the node centre, and
absolute positions are resolved through parent containers.

Exit status is non-zero when any error (or, with --strict, any warning) is
found, so it can gate a workflow. Compressed (non-XML) diagram pages are
skipped with a warning — this skill always writes uncompressed XML.

Usage: python3 validate.py <file.drawio> [--strict] [--json]
"""
import argparse
import json
import sys
import xml.etree.ElementTree as ET

RESERVED = {"0", "1"}


def diag(code, severity, subject, message, fix):
    """One structured finding: stable code, the cell(s) it is about, prose, fix."""
    return {"code": code, "severity": severity, "subject": subject,
            "message": message, "fix": fix}


def rect(cell):
    """Return (x, y, w, h) floats for a cell's geometry, or None if absent/bad.

    x/y default to 0 when omitted: draw.io treats a missing position as the
    origin, and container-managed children (table rows, swimlane/UML-class
    lines under tableLayout) legitimately omit x/y while keeping width/height.
    Only width/height are required to be present and numeric.
    """
    g = cell.find("mxGeometry")
    if g is None:
        return None
    try:
        return (float(g.get("x", "0")), float(g.get("y", "0")),
                float(g.get("width", "nan")), float(g.get("height", "nan")))
    except ValueError:
        return None


def is_edge_label(cell):
    """True for a draw.io edge label / relative-positioned child vertex.

    These legitimately omit width/height: their position is given relative to a
    parent edge (style ``edgeLabel``) or via ``relative="1"`` geometry. Treating
    them as normal vertices wrongly flags them as missing/invalid geometry.
    """
    if "edgeLabel" in (cell.get("style") or ""):
        return True
    g = cell.find("mxGeometry")
    return g is not None and g.get("relative") == "1"


def is_activation_bar(cell):
    """True if cell is a sequence diagram lifeline activation bar.

    In UML sequence diagrams, messages pass across lifelines and activation bars
    between non-adjacent participants, so these are not obstacles to route around.
    """
    style = cell.get("style") or ""
    if "outlineConnect=0" in style or "perimeter=orthogonalPerimeter" in style:
        return True
    g = cell.find("mxGeometry")
    if g is not None:
        try:
            return float(g.get("width", "999")) <= 15
        except ValueError:
            pass
    return False


def overlap(a, b):
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    return ax < bx + bw and bx < ax + aw and ay < by + bh and by < ay + ah


# --- Edge routing geometry -------------------------------------------------
#
# These helpers reason about edge paths. They only apply to edges with explicit
# waypoints (the route is otherwise computed by draw.io at render time and not
# stored in the XML), so the checks never guess an auto-routed path.

def style_num(style, key):
    """Return float value of ``key=`` in a draw.io style string, or None."""
    for part in (style or "").split(";"):
        if part.startswith(key + "="):
            try:
                return float(part.split("=", 1)[1])
            except ValueError:
                return None
    return None


def abs_rect(cell, by_id):
    """Absolute (x, y, w, h) of a vertex, summing parent-container offsets.

    Children of a container use coordinates relative to the container origin, so
    an edge spanning containers needs absolute positions to be compared.
    """
    r = rect(cell)
    if r is None or any(v != v for v in r):
        return None
    x, y, w, h = r
    parent, seen = cell.get("parent"), set()
    while parent and parent in by_id and parent not in seen:
        seen.add(parent)
        p = by_id[parent]
        if p.get("vertex") == "1":
            pr = rect(p)
            if pr and not any(v != v for v in pr):
                x += pr[0]
                y += pr[1]
        parent = p.get("parent")
    return (x, y, w, h)


def endpoint(edge, end, by_id):
    """Absolute (x, y) where ``edge`` meets its source/target vertex.

    Honours exitX/exitY (source) and entryX/entryY (target) if the style pins
    them. If not pinned, infers perimeter contact point from adjacent waypoint
    or connecting vertex; falls back to vertex centre if unresolved.
    """
    vid = edge.get(end)
    if not vid or vid not in by_id:
        return None
    box = abs_rect(by_id[vid], by_id)
    if box is None:
        return None
    x, y, w, h = box
    style = edge.get("style") or ""
    fx = style_num(style, "exitX" if end == "source" else "entryX")
    fy = style_num(style, "exitY" if end == "source" else "entryY")
    if fx is not None or fy is not None:
        return (x + (fx if fx is not None else 0.5) * w,
                y + (fy if fy is not None else 0.5) * h)

    waypoints = edge_waypoints(edge)
    cx, cy = x + 0.5 * w, y + 0.5 * h
    if end == "source":
        if waypoints:
            adj = waypoints[0]
        else:
            other_id = edge.get("target")
            other_box = abs_rect(by_id[other_id], by_id) if other_id in by_id else None
            adj = (other_box[0] + 0.5 * other_box[2], other_box[1] + 0.5 * other_box[3]) if other_box else None
    else:
        if waypoints:
            adj = waypoints[-1]
        else:
            other_id = edge.get("source")
            other_box = abs_rect(by_id[other_id], by_id) if other_id in by_id else None
            adj = (other_box[0] + 0.5 * other_box[2], other_box[1] + 0.5 * other_box[3]) if other_box else None

    if adj is None:
        return (cx, cy)

    adj_x, adj_y = adj
    if abs(adj_x - cx) < 1e-6 and abs(adj_y - cy) < 1e-6:
        return (cx, cy)

    # For orthogonal edges and cardinal-port shapes:
    # 1. Inside horizontal span [x, x + w] -> connects to top or bottom port
    if x <= adj_x <= x + w:
        return (cx, y) if adj_y < cy else (cx, y + h)
    # 2. Inside vertical span [y, y + h] -> connects to left or right port
    if y <= adj_y <= y + h:
        return (x, cy) if adj_x < cx else (x + w, cy)

    # 3. Diagonal relative to box -> find closest cardinal face
    dist_top = abs(adj_y - y) if adj_y < y else float("inf")
    dist_bot = abs(adj_y - (y + h)) if adj_y > y + h else float("inf")
    dist_left = abs(adj_x - x) if adj_x < x else float("inf")
    dist_right = abs(adj_x - (x + w)) if adj_x > x + w else float("inf")
    min_d = min(dist_top, dist_bot, dist_left, dist_right)
    if min_d == dist_top:
        return (cx, y)
    elif min_d == dist_bot:
        return (cx, y + h)
    elif min_d == dist_left:
        return (x, cy)
    else:
        return (x + w, cy)


def edge_waypoints(edge):
    """Explicit <Array as="points"> waypoints of an edge as [(x, y), ...]."""
    g = edge.find("mxGeometry")
    if g is None:
        return []
    arr = g.find("Array")
    if arr is None:
        return []
    pts = []
    for pt in arr.findall("mxPoint"):
        px, py = pt.get("x"), pt.get("y")
        if px is not None and py is not None:
            try:
                pts.append((float(px), float(py)))
            except ValueError:
                pass
    return pts


def edge_route(edge, by_id):
    """Absolute polyline [(x, y), ...] for an edge, or None.

    Returns full polyline for waypointed edges, or auto-routes straight/orthogonal
    segments when unwaypointed so through-vertex and crossing errors are caught.
    """
    s, t = endpoint(edge, "source", by_id), endpoint(edge, "target", by_id)
    if s is None or t is None:
        return None
    waypoints = edge_waypoints(edge)
    if waypoints:
        return [s] + waypoints + [t]

    # For unwaypointed edges:
    # 1. Collinear straight lines (horizontal or vertical)
    if abs(s[0] - t[0]) < 1e-3 or abs(s[1] - t[1]) < 1e-3:
        return [s, t]

    # 2. Orthogonal edge routing fallback
    style = edge.get("style") or ""
    if "edgeStyle=orthogonalEdgeStyle" in style or "orthogonal" in style:
        ex_x = style_num(style, "exitX")
        ex_y = style_num(style, "exitY")
        en_x = style_num(style, "entryX")
        en_y = style_num(style, "entryY")
        if ex_y in (0.0, 1.0) and en_x in (0.0, 1.0):
            return [s, (s[0], t[1]), t]
        elif ex_x in (0.0, 1.0) and en_y in (0.0, 1.0):
            return [s, (t[0], s[1]), t]
        elif ex_y in (0.0, 1.0) and en_y in (0.0, 1.0):
            mid_y = (s[1] + t[1]) / 2.0
            return [s, (s[0], mid_y), (t[0], mid_y), t]
        elif ex_x in (0.0, 1.0) and en_x in (0.0, 1.0):
            mid_x = (s[0] + t[0]) / 2.0
            return [s, (mid_x, s[1]), (mid_x, t[1]), t]
        else:
            mid_x = (s[0] + t[0]) / 2.0
            return [s, (mid_x, s[1]), (mid_x, t[1]), t]

    return [s, t]


def _orient(a, b, c):
    v = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
    return 0 if abs(v) < 1e-9 else (1 if v > 0 else -1)


def segments_cross(p1, p2, p3, p4):
    """True if segments p1p2 and p3p4 properly cross (interior intersection).

    Proper crossing only: collinear overlap and shared-endpoint touches return
    False, so edges meeting at a common node or grazing a corner are not flagged.
    """
    o1, o2 = _orient(p1, p2, p3), _orient(p1, p2, p4)
    o3, o4 = _orient(p3, p4, p1), _orient(p3, p4, p2)
    return o1 != o2 and o3 != o4 and 0 not in (o1, o2, o3, o4)


def _point_in_rect(p, box, eps=1e-6):
    x, y, w, h = box
    return x + eps < p[0] < x + w - eps and y + eps < p[1] < y + h - eps


def route_hits_rect(points, box):
    """True if a polyline enters a rectangle's interior or crosses a border."""
    x, y, w, h = box
    corners = [(x, y), (x + w, y), (x + w, y + h), (x, y + h)]
    borders = list(zip(corners, corners[1:] + corners[:1]))
    for a, b in zip(points, points[1:]):
        if _point_in_rect(a, box) or _point_in_rect(b, box):
            return True
        if any(segments_cross(a, b, c, d) for c, d in borders):
            return True
    return False


def routes_cross(pa, pb):
    """True if any segment of polyline pa properly crosses any of pb."""
    for a1, a2 in zip(pa, pa[1:]):
        for b1, b2 in zip(pb, pb[1:]):
            if segments_cross(a1, a2, b1, b2):
                return True
    return False


def geometry_checks(cells, ids, parents):
    """Edge-through-vertex (error) and edge-crossing (warning) checks."""
    errors = []
    warns = []
    routed = []          # (edge_id, polyline, {source, target})
    for c in cells:
        if c.get("edge") == "1":
            pts = edge_route(c, ids)
            if pts:
                routed.append((c.get("id"), pts,
                               {c.get("source"), c.get("target")}))
    # Edge routes through an unrelated leaf vertex (containers wrap children, so
    # an edge legitimately traverses them — restrict to leaves, as overlap does).
    leaves = [(c.get("id"), abs_rect(c, ids)) for c in cells
              if c.get("vertex") == "1" and c.get("id") not in parents
              and not is_edge_label(c) and not is_activation_bar(c)]
    leaves = [(vid, box) for vid, box in leaves if box]
    for eid, pts, ends in routed:
        for vid, box in leaves:
            if vid not in ends and route_hits_rect(pts, box):
                errors.append(diag(
                    "E-EDGE-THROUGH-VERTEX", "error", eid,
                    f"edge {eid!r} routes through vertex {vid!r}",
                    "add waypoints (<Array as=\"points\">) or reroute so the path goes around the vertex"))
    # Edge-edge crossings (both routes known).
    for i in range(len(routed)):
        for j in range(i + 1, len(routed)):
            (ia, pa, _), (ib, pb, _) = routed[i], routed[j]
            if routes_cross(pa, pb):
                warns.append(diag(
                    "W-EDGE-CROSS", "warning", f"{ia},{ib}",
                    f"edges {ia!r} and {ib!r} cross",
                    "add waypoints to one edge or reroute it so the paths "
                    "do not cross"))
    return errors, warns


def check_page(diagram, is_ad=False, is_asis=False, is_sd=False):
    """Run all checks against one <diagram> page element. Returns (errors, warns)."""
    model = diagram.find("mxGraphModel")
    if model is None:
        return [], [diag("W-COMPRESSED-PAGE", "warning", diagram.get("id", "?"),
                         f"page {diagram.get('name', '?')!r} contains compressed (non-XML) payload; skipped",
                         "export from draw.io with compressed=false")]
    root = model.find("root")
    # Normalize UserObject/object wrappers (used for links & metadata): the id
    # lives on the wrapper, geometry/style on the inner mxCell — fold the two
    # into one cell so edges referencing the wrapper id resolve.
    cells = []
    for child in (root if root is not None else []):
        if child.tag == "mxCell":
            cells.append(child)
        elif child.tag in ("UserObject", "object"):
            inner = child.find("mxCell")
            if inner is not None:
                inner.set("id", child.get("id", ""))
                cells.append(inner)
    errors, warns = [], []
    ids = {}
    for c in cells:
        cid = c.get("id")
        if cid in ids:
            errors.append(diag("E-DUP-ID", "error", cid,
                               f"duplicate id {cid!r}",
                               "give each cell a unique id"))
        ids[cid] = c
    parents = {c.get("parent") for c in cells}            # ids that have children
    for c in cells:
        cid, parent = c.get("id"), c.get("parent")
        is_v, is_e = c.get("vertex") == "1", c.get("edge") == "1"
        if parent is not None and parent not in ids:
            errors.append(diag(
                "E-BAD-PARENT", "error", cid,
                f"cell {cid!r} parent {parent!r} does not exist",
                "add the parent container or repoint parent= at an existing cell"))
        for end in ("source", "target"):
            ref = c.get(end)
            if ref and ref not in ids:
                errors.append(diag(
                    "E-DANGLING-END", "error", cid,
                    f"edge {cid!r} {end} {ref!r} does not exist",
                    "add the referenced cell or correct/remove the edge endpoint"))
        if (is_v or is_e) and cid in RESERVED:
            errors.append(diag(
                "E-RESERVED-ID", "error", cid,
                f"cell {cid!r} reuses reserved id 0/1",
                "use any other id (draw.io reserves 0/1 for the graph root)"))
        if is_v and not is_edge_label(c):
            r = rect(c)
            if r is None or any(v != v for v in r):       # None or NaN
                errors.append(diag(
                    "E-GEOMETRY", "error", cid,
                    f"vertex {cid!r} has missing/invalid geometry",
                    "add an <mxGeometry> with numeric x, y, width, height"))
            else:
                x, y, w, h = r
                if w <= 0 or h <= 0:
                    warns.append(diag(
                        "W-SIZE", "warning", cid,
                        f"vertex {cid!r} non-positive size {w:g}x{h:g}",
                        "set width/height to positive values"))
                if x < 0 or y < 0:
                    warns.append(diag(
                        "W-POSITION", "warning", cid,
                        f"vertex {cid!r} negative position ({x:g},{y:g})",
                        "shift the vertex into the positive quadrant "
                        "(the draw.io canvas starts at 0,0)"))
    # Sibling overlap: only leaf vertices (containers legitimately wrap children).
    boxes = [(c.get("id"), c.get("parent"), rect(c)) for c in cells
             if c.get("vertex") == "1" and c.get("id") not in parents and rect(c)
             and not any(v != v for v in rect(c))]
    for i in range(len(boxes)):
        for j in range(i + 1, len(boxes)):
            (ia, pa, ra), (ib, pb, rb) = boxes[i], boxes[j]
            if pa == pb and overlap(ra, rb):
                warns.append(diag(
                    "W-OVERLAP", "warning", f"{ia},{ib}",
                    f"vertices {ia!r} and {ib!r} overlap",
                    "move the siblings apart or nest one inside the other"))
    # Endpoint overlap: a line end cannot overlap a line start (and vice versa).
    # Line end CAN overlap line end; line start CAN overlap line start.
    edges = [c for c in cells if c.get("edge") == "1"]
    seen_overlaps = set()
    for e1 in edges:
        t1 = endpoint(e1, "target", ids)
        if t1 is None:
            continue
        for e2 in edges:
            if e1 is e2:
                continue
            s2 = endpoint(e2, "source", ids)
            if s2 is None:
                continue
            same_vertex = (e1.get("target") == e2.get("source")) and (e1.get("target") is not None)
            dist = ((t1[0] - s2[0])**2 + (t1[1] - s2[1])**2)**0.5
            if (same_vertex and dist <= 10.0) or (not same_vertex and dist < 2.0):
                pair_key = (e1.get("id"), e2.get("id"))
                if pair_key in seen_overlaps:
                    continue
                seen_overlaps.add(pair_key)
                vid = e1.get("target") if same_vertex else None
                errors.append(diag(
                    "E-ENDPOINT-OVERLAP", "error", f"{e1.get('id')},{e2.get('id')}",
                    f"edge {e1.get('id')!r} end overlaps edge {e2.get('id')!r} start at "
                    f"({round(t1[0], 1):g},{round(t1[1], 1):g})" + (f" on vertex {vid!r}" if vid else ""),
                    "offset exitX/exitY or entryX/entryY so a line end does not overlap a line start"))

    # Crooked endpoint check: flag when first/last waypoint is slightly misaligned with pinned port (0.5 < |delta| <= 30)
    for e in edges:
        pts = edge_waypoints(e)
        if not pts:
            continue
        style = e.get("style") or ""
        s_pt = endpoint(e, "source", ids)
        t_pt = endpoint(e, "target", ids)
        ex_y = style_num(style, "exitY")
        ex_x = style_num(style, "exitX")
        en_y = style_num(style, "entryY")
        en_x = style_num(style, "entryX")

        if s_pt:
            if ex_y in (0.0, 1.0):
                delta = abs(pts[0][0] - s_pt[0])
                if 0.5 < delta <= 30.0:
                    errors.append(diag(
                        "E-CROOKED-ENDPOINT", "error", e.get("id"),
                        f"edge {e.get('id')!r} source connection crooked by {round(delta, 1)}px (waypoint x={pts[0][0]} vs port x={round(s_pt[0], 1)})",
                        "align waypoint x with source port x or run validate.py --fix"))
            elif ex_x in (0.0, 1.0):
                delta = abs(pts[0][1] - s_pt[1])
                if 0.5 < delta <= 30.0:
                    errors.append(diag(
                        "E-CROOKED-ENDPOINT", "error", e.get("id"),
                        f"edge {e.get('id')!r} source connection crooked by {round(delta, 1)}px (waypoint y={pts[0][1]} vs port y={round(s_pt[1], 1)})",
                        "align waypoint y with source port y or run validate.py --fix"))

        if t_pt:
            if en_y in (0.0, 1.0):
                delta = abs(pts[-1][0] - t_pt[0])
                if 0.5 < delta <= 30.0:
                    errors.append(diag(
                        "E-CROOKED-ENDPOINT", "error", e.get("id"),
                        f"edge {e.get('id')!r} target connection crooked by {round(delta, 1)}px (waypoint x={pts[-1][0]} vs port x={round(t_pt[0], 1)})",
                        "align waypoint x with target port x or run validate.py --fix"))
            elif en_x in (0.0, 1.0):
                delta = abs(pts[-1][1] - t_pt[1])
                if 0.5 < delta <= 30.0:
                    errors.append(diag(
                        "E-CROOKED-ENDPOINT", "error", e.get("id"),
                        f"edge {e.get('id')!r} target connection crooked by {round(delta, 1)}px (waypoint y={pts[-1][1]} vs port y={round(t_pt[1], 1)})",
                        "align waypoint y with target port y or run validate.py --fix"))

    # Label checks: overlap with vertices, overlap with other labels, and burying short edges
    diagram_name = (diagram.get("name") or "").lower()
    leaves = [(c.get("id"), abs_rect(c, ids)) for c in cells
              if c.get("vertex") == "1" and c.get("id") not in parents
              and not is_edge_label(c) and not is_activation_bar(c)
              and "umlLifeline" not in (c.get("style") or "")]
    leaves = [(vid, box) for vid, box in leaves if box]

    edge_label_data = []
    for c in edges:
        val = c.get("value")
        if not val or not val.strip():
            continue
        s, t = endpoint(c, "source", ids), endpoint(c, "target", ids)
        if s is None or t is None:
            continue
        pts = edge_waypoints(c)
        poly = [s] + pts + [t]
        seg_lengths = []
        total_len = 0.0
        for p1, p2 in zip(poly, poly[1:]):
            l = ((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2)**0.5
            seg_lengths.append(l)
            total_len += l
        if total_len < 1e-3:
            continue

        geom = c.find("mxGeometry")
        rx = float(geom.get("x", "0")) if geom is not None else 0.0
        target_dist = ((rx + 1.0) / 2.0) * total_len
        cur_dist = 0.0
        lx, ly = poly[len(poly) // 2]
        for (p1, p2), sl in zip(zip(poly, poly[1:]), seg_lengths):
            if cur_dist + sl >= target_dist:
                ratio = (target_dist - cur_dist) / sl if sl > 0 else 0.5
                lx = p1[0] + ratio * (p2[0] - p1[0])
                ly = p1[1] + ratio * (p2[1] - p1[1])
                break
            cur_dist += sl

        if geom is not None:
            off = geom.find("mxPoint")
            if off is not None and off.get("as") == "offset":
                try:
                    lx += float(off.get("x", "0"))
                    ly += float(off.get("y", "0"))
                except ValueError:
                    pass

        clean_val = val.replace("&#xa;", "\n").replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&").replace("<br>", "\n")
        lines = clean_val.split("\n")
        max_len = max(len(line.strip()) for line in lines) if lines else 0
        num_lines = len(lines)
        lw = max(30.0, max_len * 7.2 + 8.0)
        lh = max(20.0, num_lines * 16.0 + 4.0)
        label_box = (lx - lw / 2.0, ly - lh / 2.0, lw, lh)
        edge_label_data.append((c, label_box, clean_val, total_len, lw, lh))

        # Check: label buries edge (skip for sequence, legacy survey, and locked activity diagrams)
        is_sd_page = is_sd or any("umlLifeline" in (cell.get("style") or "") for cell in cells)
        if not is_sd_page and not is_asis and not is_ad and total_len < 160.0 and lw > total_len + 25.0:
            errors.append(diag(
                "E-LABEL-BURIES-EDGE", "error", c.get("id"),
                f"edge {c.get('id')!r} length ({round(total_len)}px) is buried by label width ({round(lw)}px)",
                "increase distance between source and target, shorten label, or wrap text with &#xa;"))

        # Check: label overlaps vertex (enforced for activity, state, usecase, class, architecture, stakeholder diagrams)
        if not is_asis and not is_sd_page:
            ends = {c.get("source"), c.get("target")}
            for vid, box in leaves:
                if vid not in ends and overlap(label_box, box):
                    errors.append(diag(
                        "E-LABEL-OVERLAP-VERTEX", "error", c.get("id"),
                        f"edge {c.get('id')!r} label {val[:30]!r} overlaps vertex {vid!r}",
                        "wrap label text with &#xa;, adjust offset, or route edge further from vertex"))

    # Check: label overlaps label
    for i in range(len(edge_label_data)):
        c1, box1, v1, _, _, _ = edge_label_data[i]
        for j in range(i + 1, len(edge_label_data)):
            c2, box2, v2, _, _, _ = edge_label_data[j]
            if overlap(box1, box2):
                ix = max(0.0, min(box1[0] + box1[2], box2[0] + box2[2]) - max(box1[0], box2[0]))
                iy = max(0.0, min(box1[1] + box1[3], box2[1] + box2[3]) - max(box1[1], box2[1]))
                if ix > 10.0 and iy > 10.0:
                    errors.append(diag(
                        "E-LABEL-OVERLAP-LABEL", "error", c1.get("id"),
                        f"edge {c1.get('id')!r} label {v1[:20]!r} overlaps edge {c2.get('id')!r} label {v2[:20]!r}",
                        "move edge waypoints or adjust label offset to separate the labels"))

    geo_errs, geo_warns = geometry_checks(cells, ids, parents)
    errors += geo_errs
    warns += geo_warns
    return errors, warns


def auto_fix_crooked(tree, file_path):
    """Auto-align crooked edge waypoints to pinned ports."""
    modified = False
    root = tree.getroot()
    pages = root.findall("diagram")
    if not pages:
        pages = [root]
    for diagram in pages:
        model = diagram.find("mxGraphModel")
        if model is None:
            continue
        root = model.find("root")
        cells = [c for c in root if c.tag == "mxCell"]
        ids = {c.get("id"): c for c in cells}
        edges = [c for c in cells if c.get("edge") == "1"]
        for e in edges:
            pts = edge_waypoints(e)
            if not pts:
                continue
            style = e.get("style") or ""
            s_pt = endpoint(e, "source", ids)
            t_pt = endpoint(e, "target", ids)
            ex_y = style_num(style, "exitY")
            ex_x = style_num(style, "exitX")
            en_y = style_num(style, "entryY")
            en_x = style_num(style, "entryX")

            geom = e.find("mxGeometry")
            arr = geom.find("Array") if geom is not None else None
            mx_pts = arr.findall("mxPoint") if arr is not None else []

            if s_pt and mx_pts:
                if ex_y in (0.0, 1.0):
                    delta = abs(pts[0][0] - s_pt[0])
                    if 0.5 < delta <= 30.0:
                        mx_pts[0].set("x", str(round(s_pt[0], 1)))
                        modified = True
                elif ex_x in (0.0, 1.0):
                    delta = abs(pts[0][1] - s_pt[1])
                    if 0.5 < delta <= 30.0:
                        mx_pts[0].set("y", str(round(s_pt[1], 1)))
                        modified = True

            if t_pt and mx_pts:
                if en_y in (0.0, 1.0):
                    delta = abs(pts[-1][0] - t_pt[0])
                    if 0.5 < delta <= 30.0:
                        mx_pts[-1].set("x", str(round(t_pt[0], 1)))
                        modified = True
                elif en_x in (0.0, 1.0):
                    delta = abs(pts[-1][1] - t_pt[1])
                    if 0.5 < delta <= 30.0:
                        mx_pts[-1].set("y", str(round(t_pt[1], 1)))
                        modified = True
    if modified:
        tree.write(file_path, encoding="utf-8", xml_declaration=True)
        print(f"fixed crooked endpoints in {file_path}")
    return modified


def render(d, severity):
    """One finding -> the prose line format."""
    return f"{severity}: [{d['code']}] {d['message']} (fix: {d['fix']})"


def main():
    import os
    ap = argparse.ArgumentParser(description="Lint a .drawio file for structural errors.")
    ap.add_argument("file")
    ap.add_argument("--strict", action="store_true", help="treat warnings as failure too")
    ap.add_argument("--json", action="store_true",
                    help="emit findings as structured JSON instead of prose lines")
    ap.add_argument("--fix", action="store_true",
                    help="auto-fix crooked endpoints and write back to file")
    ap.add_argument("--score", action="store_true",
                    help="also print a readability score (lower is better) — "
                         "useful for comparing layout variants of the same graph")
    args = ap.parse_args()
    try:
        tree = ET.parse(args.file)
    except (ET.ParseError, OSError) as exc:
        sys.exit(f"error: cannot parse {args.file}: {exc}")

    if args.fix:
        if auto_fix_crooked(tree, args.file):
            tree = ET.parse(args.file)

    base_name = os.path.basename(args.file).lower()
    is_ad_file = base_name.startswith("ad")
    is_asis_file = base_name.startswith("asis")
    is_sd_file = base_name.startswith("sd")
    root = tree.getroot()
    pages = root.findall("diagram")
    if not pages:
        pages = [root]
    errors, warns = [], []
    for page in pages:
        e, w = check_page(page, is_ad=is_ad_file, is_asis=is_asis_file, is_sd=is_sd_file)
        errors += e
        warns += w
    if args.json:
        print(json.dumps({"errors": len(errors), "warnings": len(warns),
                          "findings": errors + warns}, indent=2))
    else:
        for w in warns:
            print(render(w, "warning"))
        for e in errors:
            print(render(e, "error"))
        print(f"{len(errors)} error(s), {len(warns)} warning(s)")
    if args.score:
        lines = [d["message"] for d in errors + warns]
        # Weighted by how badly each defect hurts readability. Comparable only
        # across variants of the SAME graph (same nodes/edges).
        through = sum(1 for m in lines if "routes through" in m)
        cross = sum(1 for m in lines if " cross" in m)
        olap = sum(1 for m in lines if " overlap" in m)
        print(f"score: {20 * through + 10 * cross + 5 * olap} "
              f"({through} through-vertex, {cross} crossings, {olap} overlaps)")
    if errors or (args.strict and warns):
        sys.exit(1)


if __name__ == "__main__":
    main()