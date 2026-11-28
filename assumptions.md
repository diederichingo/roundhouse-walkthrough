# Roundhouse walkthrough v1 — assumptions

Every item below is an assumption used in the 3D model. Confirmed dimensions come from the Option B B-sheets and `/workspace/roundhouse/dimensions.md`. Assumed items are also listed in the walkthrough UI.

## Instructed assumptions (from the build brief)

- House, utility and the kitchen under-sill walls are a **250 mm sandwich**: 150 mm timber frame with insulation and up to 50 mm cob/plaster skin each face, centred on the centreline, on the 400 mm plinth (75 mm reveal each side). Confirmed by Roundhouse Control, 25 Nov 2026. The outer finish is still called cob/plaster.
- Curved inner wall: **200 mm × 2 355 mm (unconfirmed / CHECK)** — 100 mm frame + 50 mm skin each face, flush with the 200 mm plinth, from plinth top (20 mm AFF) to the outer head-plate soffit (2 375 mm AFF). **100 × 50 sole on DPC**, **100 × 50 head** (closing plate, not tied to the roof), **100 × 100 × 2 355 mm** full-height end post on the plinth. Intermediate 100 mm studs are not added (battens do that work; CHECK if Joshua adds 100 × 50 studs later). Interior partitions that are not this wall stay 2 200 mm.
- Kitchen window: **900 mm wide × 1 100 mm high**, sill **1 200** (size and sill still assumed), against the N post, above the counter. The window top is the confirmed **2 300 mm**. The kitchen sill rail top is the confirmed **1 185 mm AFF** (100 mm rail; cob under the rail is 715 mm from the sole).
- Finished floor level: **180 mm above grade** (drawn provisional in the plan).
- Green sandwich roof panel thickness: **60 mm**, measured normal to the 7° plane.
- Window / door frame depth: **70 mm**.
- Site: **level** (no topography in the drawings).

## Further assumptions made to build the model

- Unfounded interior partitions (bathroom / bed wall, shower / closet wall, closet sides) stay **2 200 mm** high above FFL. The curved inner wall is **2 355 mm** from the plinth (top 2 375 mm AFF), unconfirmed.
- Unfounded partition thickness: **100 mm**.
- Closet and bed blocks follow Els’s floor-plan sketch, converted from the same sketch coordinates used on A-07 / B-06. The drawings say that furniture is **not to scale**; positions are therefore indicative.
- Bed height: **450 mm**. Mattress / bed simple block, no bedding detail.
- WC, bidet and basin: simple white blocks / bowls, **400 mm** high, ~**400 mm** plan size, at the sketch points.
- Shower tray: **50 mm** high, plan from the sketch.
- Stove: **900 mm** high (as already assumed on B-09).
- Counter depth and length: from the sketch conversion; a 50 mm worktop on a 850 mm carcass.
- Garden French doors: two leaves, split **56 % / 44 %** (already marked assumed in the drawing scripts), both open **inward** to 90°.
- Back door: leaf **70 %** of the 1 330 mm clear opening, fixed side-light on the south part of the unit; hinge on the north jamb; opens **outward** to 90° (as drawn).
- Utility south door: opening height **2 100 mm** (dimensioned on B-13); leaf hinged on the west jamb (SW post); opens outward to 90°.
- Window operation: windows are **fixed glass** (opening type is not in the drawings). Only doors animate.
- Fitting gap **15 mm** each side of each unit, as drawn (fabricator still to confirm).
- Upper closing: non-load-bearing **250 mm sandwich** (unconfirmed / CHECK) from the head-plate soffit/top up to the roof underside minus the **20 mm** slip joint, following the 7° plane with y. US 150 × 50 (was 100 × 50), 150 mm across the wall, with skins on both faces.
- Mullions: modelled with the drawn radial taper (30 mm inside, 55–72 mm outside, 150 mm deep).
- Knee braces: **100 × 100 mm**, 45°, legs **600 mm** to the member centreline. Along the sloped main beams the uphill brace is longer (cut to the 7° soffit). Radial braces at E / W / corners / extension meet the **purlin soffit**; along-wall braces at E / W and the N–S braces at N / S / centre meet the **main-beam soffit**.
- Post bases: 100 mm galvanised stand-off, as drawn. Corner pads top **50 mm above grade**. Centre pad top flush with FFL. Extension pedestals top level with the 400 mm plinth.
- Roof covering is **green sandwich panels** (as written on the B-sheets and in the project plan), not polycarbonate. Colour is a generic mid-green; the RAL shade is still to pick with the supplier. Panel ribs are a light procedural texture, not a manufacturer profile.
- Solar array (8 × 600 W) is **not modelled**; the layout is not in the drawings.
- Gutters, downpipes, flashings, DPC, lath and insulation are not modelled.
- Earth floor: a simple packed-earth colour inside the plinth, no layer thickness shown above FFL (FFL is the walk surface).
- Interior fill light is added so the rooms are readable when the sun is low; it is not a real lamp.
- Sun position: NOAA-style solar algorithm for **40.17° N, 7.17° W** (Penamacor). Clock time is **Europe/Lisbon** (WET, UTC+0, in winter; WEST, UTC+1, last Sunday of March to last Sunday of October). Atmospheric refraction is a simple correction; it is not a full SPA.
- First-person eye height: **1.70 m** above FFL. Collision radius **0.22 m** against walls, posts, the curved wall, the utility, the counter, the stove, closets and the bed.
- Walkable ground is treated as flat at FFL inside the house and utility, and at grade outside (180 mm below). The model does not step the player up the 180 mm plinth edge; a short ease is applied at door thresholds so the walk-through stays smooth. (Assumed control convenience.)
- Window / counter clashes are evaluated in plan and elevation. The kitchen window (sill 1 200 mm, assumed) sits 300 mm above the confirmed 900 mm worktop, so that pair is clear. Other windows (sill 400 mm) do not overlap a kitchen counter in plan.

## World axis mapping (v1b, corrected)

Drawing coordinates are x east, y north, z up, as on the B-sheets (N at the top of the floor plan, utility to the east, garden doors to the west, low roof edge to the south).

three.js world mapping used in this walkthrough:

- **+X = east**
- **+Y = up**
- **−Z = north** (+Z = south)

So drawing (x, y, z) maps to world (x, z, −y). This is the convention that puts **east on the right** of a camera looking north, matching a person standing in the house. An earlier version used +Z as north, which left-right mirrored the view: in a photograph from the south-east the utility appeared on the west side of the frame.

The sun azimuth is measured from this same north (−Z), clockwise, so 0° is north, 90° is east.

## Roof raise (final, 25 Nov 2026)

`ROOF_RAISE = 0.200` m (exactly 200 mm). Source: Roundhouse bot, final, 25 Nov 2026, synced to `geometry_report_B.txt` and `extension_report_B.txt`.

Heights above FFL (7° slope; UI values are rounded to the nearest millimetre):

- Roof underside: S wall 3 110 mm, centre 3 724 mm (model 3 723.9), N wall 4 338 mm (model 4 337.8)
- Main-beam soffit, all four beams (x = −5, 0, +5, +9 m): S wall 2 670 mm, centre 3 284 mm (model 3 283.9), N wall 3 898 mm (model 3 897.8)
- Eaves (roof underside, at y = ±6 200): S 2 963 mm (model 2 962.7), N 4 485 mm (model 4 485.2)
- Brace undersides: S inside 1 999 mm, E/W 2 613 mm, N 3 227 mm, outdoor S corners 1 877 mm
- Head plate 2 375–2 475 mm, windows 400–2 300 mm, door-head line 2 375 mm, utility plate 2 650 mm
- East-beam to utility plate: SE gap 315 mm, NE gap 560 mm. FFL stays 180 mm above grade.

`geometry_report_B.txt` states the rounded wall/centre underside figures (3 110 / 3 724 / 4 338). `extension_report_B.txt` gives the unrounded model (3 723.9 at y = 0, which rounds to 3 724) and notes that heights depend only on northing, so every main beam including x = +9 matches at the same y.

Raised together: the roof structure and all roof posts (house ring, centre, corners, and the three east-extension posts) — beams, purlins, sandwich panels, and brace tops and feet.

Not raised: cob walls, the head plate (top 2 475 mm, soffit 2 375 mm), openings (back-door head 2 360 mm, garden doors 2 330 mm, windows 2 300 mm), plinth, foundations, and the utility top plate (2 650 mm). FFL stays 180 mm above grade. The cob upper closing simply fills the extra gap up to the raised roof underside (minus the 20 mm slip).

## Confirmed: kitchen counters (25 Nov 2026)

Kitchen counter height is **900 mm** above the finished inside floor, for **all kitchen counters**. Confirmed by Tom, 25 Nov 2026. This is no longer an assumption. All window tops stay at **2 300 mm**. The kitchen-window sill remains **1 200 mm**, assumed, leaving a 300 mm wall/apron above the worktop.

## Rev 2026-11-25f (final)

Roof plan **16.5 × 12.4 m**: x from −6 000 to +10 500 mm, y ±6 200 mm. Main beams, eave purlins and the panel edge are flush at y = ±6 200 (200 mm past the end-post centrelines). Eave purlin centreline ±6 125 mm. No steel end-post caps; every roof post has a 60 × 100 × 120 mm tenon into the beam.

East overhang **1.5 m** past the beam at x = +9 (roof edge at x = +10 500). Confirmed (Tom, 25 Nov 2026). The 600/600 45° E–W braces under that overhang match the west eave.

Eaves (roof underside): south **2 962.7 mm** (rounds to 2 963), north **4 485.2 mm** (rounds to 4 485) above FFL. Wall underside figures are unchanged (3 110 / 3 724 / 4 338). Utility SE gap under the east beam remains **315 mm**.

Utility posts: wedged through-tenons, plates over the post tops, no utility pegs.

Structural timber: **Douglas fir, C24 or equivalent**. Moisture content and treatment are still open. Sandwich panel product is still to pick.

The outdoor SW / SE / SE-ext N–S brace underside of **1 877 mm** was accepted by Tom (25 Nov 2026) and is not treated as a drawn clash.

## End-post level braces (rev f detail, 25 Nov 2026)

The 12 level (E–W) braces on the six end posts (SW, SE, NW, NE, SE-ext, NE-ext) sit flush with the outer post face (the outer 100 mm band, y 6 000–6 100, mirrored on the south) instead of being centred on the post. That gives 50 mm bearing under the eave purlin (CL ±6 125). Shop lengths are unchanged (600 mm legs). Each of those 12 brace heads is fixed to the eave purlin with a galvanised steel angle, approx. 90×90×65 mm (size approx.). This came from Roundhouse Control; the B-sheets in `drawings_optionB/` had not yet been regenerated with this note when the walkthrough was updated.

The S inside brace underside of **1 999 mm** is accepted by Roundhouse as **2.00 m** (within tolerance). The height label remains visible.


## v1h — scale figures, bed size, living room

- A 1.80 m woman (about 60, slim, white hair, red dress) stands on the finished floor in front of the kitchen counter near the kitchen window, facing the counter. Label: `1.80 m`.
- A 1.70 m woman (about 40, brown hair, leopard print) stands in the free floor of the bathroom, to show room to move. Label: `1.70 m`.
- The bed mattress footprint is set to exactly 1.40 × 2.00 m (head against the closet, east side against the bathroom partition), about 480 mm high. On Els’s furniture sketch it had been about 1 515 × 1 788 mm × 450 mm high (the sketch is noted as not to scale). Label: `1.40 x 2.00 m`.
- The living room is only a two-seat couch (about 1 600 × 850 × 800) and a coffee table (900 × 500 × 400), typical furniture for a sense of space, not from the drawings. It sits in the south-west bay, south of the path to the west garden doors. The Eames ottoman was removed in v1i; the Eames lounge chair was removed in v1k. There is no chair or armchair in the living area. The walkway from the couch to the garden-door south jamb is 800 mm.


## v1j — sandwich walls (Roundhouse Control, 25 Nov 2026)

Walls are no longer solid cob. Source: `drawings_optionB/wall_buildup_proposal.md`.

- House bays, utility and the kitchen under-sill: **150 mm frame + 50 + 50 mm skins = 250 mm**, covering the 200 × 200 mm posts (25 mm cob cover each side; posts are not proud of the wall). 25 mm proud of the 150 mm frame, with 25 mm cob over the post face.
- Window frames **70 mm**, sitting in the 150 mm timber frame, not the full 250 mm. About 50 mm cob/lime reveal and 40 mm timber each side. The proposal flags that 70 mm does not span 250 mm, so a lining or deeper frame may be needed (CHECK).
- 13 big + 2 small windows have **no under-sill sandwich**; a 15 mm packer sits on the sole. The walkthrough keeps the assumed 400 mm sill, so there is a 15 mm gap between packer top (385 mm) and sill. The kitchen window keeps the under-sill sandwich; its sill stays at the assumed **1 200 mm** (the proposal notes a sill rail top of 1 185 mm AFF).
- Insulation product is still CHECK (candidate A, 150 mm expanded cork, preferred). The 50 mm skin is the example maximum (CHECK with Matilde).
- Upper closing is the same **250 mm sandwich** (unconfirmed / CHECK): the US member changes from **100 × 50 to 150 × 50**, 150 mm across the wall, flush with both faces of the 150 mm head plate (previously 25 mm shy of each face). Skins (≤ 50 mm) on both faces. The 20 mm slip joint stays; laths and skins stop short of the moving roof. Skins and cavity run past the head plate so it is not a cold band. Position is unchanged (centred on R = 5.0, from the head-plate top at 2 475 mm to the roof underside minus 20 mm). The closing is non-load-bearing and is built around the main beams and the along-wall braces; beam bearing stays on the posts.
- Head-plate remains 150 mm; the skins project 50 mm past it and continue to the roof, by design. Knee braces on the ring posts pass through the 25 mm cob that covers the inner post face — a local stop in the skin, not a structural clash.
- Inner wall height is **2 355 mm** from the 20 mm plinth (top 2 375 mm AFF), with a 100 × 50 sole on DPC, a 100 × 50 head and a 100 × 100 full-height end post, all unconfirmed / CHECK.


## v1k — living room is couch and table only

The Eames lounge chair was removed. The living room is only the two-seat couch and the coffee table. No other chair or armchair remains in the living area (Els’s furniture sketch had none). Everything else from v1j is unchanged.

The living-room Eames lounge chair was already removed in the first v1k commit. This follow-up adds the interior ceiling (CHECK / unconfirmed), from `drawings_optionB/wall_and_roof_buildup_proposal.md`.

- 150 mm insulation under the green sandwich panel, between the purlins, interiors only (house and utility). Not on the outdoor overhangs or the open east covering.
- 50 × 200 ceiling joists running N–S between the purlins, flush with the purlin soffit, at 609 mm centres in the house (16 lines, bays 1–6, plus short lookouts in the eave caps) and 550 mm in the utility (5 lines, bays 2–3).
- T&G (~20 mm) running E–W, soffit 20 mm below the purlin soffit: about **2 905 mm** AFF at the south inner face, **3 504 mm** at the centre, **4 118 mm** at the north wall centreline (the inner face at y = +4 875 is **4 102 mm**). Stops 20 mm short of the upper closing and is not fixed to the wall.
- Main beams stay fully visible below the ceiling. 240 mm of beam hangs below the purlin soffit; with the 20 mm T&G that is 220 mm of visible beam below the ceiling soffit at the south wall CL (beam soffit 2 670 mm).
- Insulation product in the roof: wood-fibre batts or unfaced Volcalis preferred (CHECK). Joist hangers / screw fixings: Connections CHECK. T&G species / finish: Joshua.


## v1l — Roundhouse answers to the v1j clash items

- Kitchen sill rail top is **1 185 mm AFF** (confirmed). The window sill (frame bottom) stays at the assumed **1 200 mm**. The 100 mm rail sits in the 150 mm frame (bottom 1 085 mm); cob under the rail is 715 mm from the sole top (370 mm). A 15 mm intended fit gap (shims + sill tape) sits between the rail and the frame, the same as the other windows.
- The 15 mm gap between the 15 mm packer (top 385 mm) and the 400 mm sill is an **intended fit gap** (`FIT_GAP`, shims + weather/air seal and sill tape on the packer). It is not a mismatch, and the packer is not thickened to 30 mm.
- The cob skin **thins or stops at the posts and knee braces**. The 200 mm posts stay 25 mm proud of the 150 mm frame; the timber is left **exposed** (or lime-washed), not wrapped in cob. Knee braces are not wrapped either (trapped moisture, awkward drying).


## v1m — close the wall to the beam; ceiling insulation inside; brace collars

- The v1j didactic section cut just east of the S ring post (1.20–3.60°) was a through-hole in the wall, and the upper closing had been stopped in each ring-post sector, leaving a see-through gap under the eave beam (the post stops at the beam soffit). Both are closed: the sandwich is continuous around the perimeter, and at each ring post the skins meet the beam and the sandwich continues from the beam top up to the 20 mm roof slip. Window frames now fill the opening so they meet the posts and mullions. Post faces below the beam stay exposed / lime-washed.
- Tom decided the roof insulation goes **inside**. The T&G ceiling is kept; the insulation-location CHECK is dropped. Product (wood-fibre / Volcalis preferred) and joist hangers remain CHECK.
- The four interior E–W brace heads at the centre purlin (tops 3 574 mm vs T&G 3 504 mm) pass through a trimmed opening with a timber collar. That clash is cleared.
- US studs are **50 mm** in the plane, 150 mm across the wall. The two studs that left 23 mm bays at the E/W ring posts (88.3° / 271.7°) are omitted, as is the 0° stud; count **50**.


## v1n — Roof off and Structure only view toggles

No geometry change. Two view toggles, usable in Orbit and Walk, and combinable: **Roof off** hides the roof panels, membrane, T&G, ceiling joists, brace collars and roof insulation so you can look down into the rooms (walls, furniture and figures stay). **Structure only** shows the timber frame (posts, main beams, purlins, braces, joists, studs, plates) and steel connectors, coloured by member type, with a compact legend; cob/plaster, insulation, panels, glazing, doors, furniture and figures are hidden. There are no rafters in this roof (purlins and panels). Turning a toggle off restores the previous view.


## v1o — south gutter at the low eave (ASSUMED)

The roof plan and overhangs are unchanged. They already match Control’s description: **1.2 m** N/S from the wall centreline (roof y = ±6 200 mm, wall CL y = ±5 000), **1.0 m** west (roof x = −6 000, wall CL x = −5 000) and **1.5 m** east of the beam at x = +9 000 (roof edge x = +10 500).

South gutter only, all figures **ASSUMED**:

- **150 mm half-round**, pre-galv zinc, hung on rise-and-fall fascia brackets at about 800 mm centres from the flush south eave purlin / panel edge. A box gutter was not used, because the purlin, main-beam ends and panel edge are already flush; hanging a half-round keeps the roof geometry unchanged.
- **Fall 3 mm/m** toward three **100 mm** circular downpipes that run to a shoe just above grade:
  - SW corner post, **x = −5.00 m** (west of all south windows);
  - SE corner post, **x = +5.00 m** (east of the bathroom windows, west of the utility);
  - SE-ext post, **x = +9.00 m** (drains the east overhang).
- Crowns (high points) at **x = 0** (15 mm above the outlets; in front of the solid south cob between the living and bedroom windows) and at **x = +7.00 m** (between the SE and SE-ext pipes). Short falls from the west stop-end (x = −6.00) and the east stop-end (x = +10.50) into the nearest pipe.
- The gutter hides with **Roof off** and is hidden in **Structure only** (rainwater goods, not frame or structural connectors).
- Saved cameras at the four south-facing big windows, standing **1.65 m** AFF and **1 m** back from the glass, looking out: South window 1 (living, SW, bay 24), South window 2 (living, SSW, bay 25), South window 3 (bedroom, SSE, bay 2), South window 4 (bedroom / bathroom, SE, bay 3). The two small bathroom windows (bays 4–5) face more south-east and were not given cameras.

Plan rev 2026-11-26g (utility door, kitchen wall, garden doors, etc.) is not in this version.


## v1p — plan rev 2026-11-26g

Walkthrough updated to the B-01–B-15 and project-plan revision of 26 November 2026 (rev g). The roof plan and the south gutter are unchanged (overhangs already 1.2 m N/S, 1.0 m W, 1.5 m E of the x = +9 000 beam). Downpipes at x = −5.00 / +5.00 / +9.00 were re-checked against the renumbered south openings; they still clear the glazing and the garden doors (the SW pipe is at the south eave, not beside the west garden doors).

### Implemented from the plan (items 1–12)

1. Utility door on the north wall of the utility (drawing y = −600, world z = +0.60): 800 mm clear / 880 mm opening, hinged on the east jamb, opening out (north, into the 806 mm gap). Leaf height **2 100 mm ASSUMED**. Drawn clearance to the back-door swing is 218.9 mm ≈ 219 mm. Indoor battery and inverter (sizes **ASSUMED**: inverter 500 × 240 × 700, battery 700 × 300 × 800) sit on the west wall with 1 m clear in front.
2. Straight cob kitchen wall, 1 100 mm high, front face on the 4.70 m chord, 2.59 m long, centred on the N post, with a 20 mm compressible strip at the post. Plinth rim widened inside to 500 mm over 1.95 m, inner face on the same chord. Counter 600 mm deep (**ASSUMED**) × 900 mm high (confirmed). Gas hob 600 × 520 mm (**ASSUMED**) under window 15.
3. Garden doors open outward.
4. Bay order from the S post: big window 1, big window 2, 300 mm cob pier 3, small windows 4 and 5. Bathroom curtain on a rail from the partition end to pier 3 (rail height 2 200 mm **ASSUMED**, cloth hangs to 200 mm AFF **ASSUMED**). The line is a diagonal to the pier, not a continuation of the partition to the ring (that would meet window 2) — CHECK with Els.
5. Kitchen window 15 west of the N post, 180–192.7°, 900 × 1 100. B-15 dimensions the sill at ≈ 1 260 (160 mm above the 1 100 shelf), so the head is 2 360. That is 60 mm above the previous confirmed 2 300 window-top rule. Implemented as drawn on B-15. Leftover plan wording still says window 1 200–2 300 / rail 1 185.
6. High window 970 × 1 190, sill 2 600, head 3 790, two top-hung outward sashes. Rod winder **ASSUMED** (16 mm). 50 mm west trimmer. US studs omitted in the opening. HW lining vs the N knee brace is a CHECK (≥ 50 mm).
7. Utility walls close up to the main roof with a 20 mm slip (under the covering on N/S/W, under the x = +9 beam on the east). No separate utility roof or ceiling; house T&G, joists and insulation stay.
8. East wall is the installation wall: 150 × 50 studs at most 450 mm, noggings at 550 / 1 000 / 1 500 / 2 000, 22 mm ply inside. A 50 mm cob/lime weather skin is kept on the outside (the wall is an exterior face). The plan says “a proper timber wall, not cob” — read here as the structure; the outside skin is the same as the other exterior walls. Hung boiler up to 150 L (size **ASSUMED** 500 × 500 × 1 200) and a gas geyser at the south end (size **ASSUMED** 350 × 250 × 700) with shelves under it. Geyser to battery 2.4 m centre to centre (one value since rev h). B-13 has said 2.4 m since rev h; the 2.6 m figure was rev g only and is stale.
9. Ledge: 150 mm board, 28 mm thick (within the 27–30 mm range), top at 1 200, on the bed-side face of the curved inner wall, about 3.83 m, in mitred lengths. Working assumption / CHECK with Els (which wall/face).
10. Text clean-up only (Option A leftover wording in the plan). Not a 3D change.
11. Low Ø100 sleeved closable inlets (V1–V4) in bays 13, 16, 6 and 7 at 450 mm AFF; shower fan / lined vent F1 high in bay 8 at 2 700. External cowl on F1 is **ASSUMED** 160 mm square.
12. Central beam: C24-graded pine at the same section is fine; no round or ungraded poles. Label only; no geometry change.

### CHECKs to confirm (not silent guesses)

- Window 1 west sash at 90° inward vs the S inward knee brace (plan: about 65 mm) — CHECK with Els and Joshua.
- High-window east lining vs the N inward knee brace (plan: ≥ 50 mm).
- Bed-area closet vs window 1 (the sketched closet stays by the bed / partition, not in front of the window).
- Curtain line (partition end to pier 3).
- Kitchen window 15 head 2 360 vs the 2 300 rule (implemented as B-15).
- Geyser-to-solar distance 2.4 m centre to centre (rev h / i / j; the old B-13 2.6 m was rev g only).
- Ledge wall/face with Els.
- Installation-wall exterior finish (cob skin vs “not cob”).

Saved cameras: kitchen (straight wall and high window), utility door, south windows 1 and 2 (new numbering, east of the S post), and south windows 24 and 25 (living SW / SSW gutter views). Living room remains couch and coffee table only.


## v1q — plan rev 2026-11-26h / 2026-11-26i, and walls closed to the ceiling

One release covering Control's rev h answers, Tom's instruction that every wall must close to the T&G, and the rev i correction of the utility east wall. Drawings: B-01–B-15 rev 2026-11-26i (authoritative). Roof plan, overhangs and the south gutter are unchanged.

### Rev h items

- Kitchen window 15: window 1 200–2 300, rail top 1 185 (85 mm above the 1 100 shelf), 15 mm fit gap. The 2 360 on B-15 (rev g) was wrong.
- Geyser to battery 2.400 m centre to centre (one value; B-13 has said 2.4 m since rev h). Kit sizes ASSUMED. Inverter sits next to the battery, not on the 2.4 m datum.
- Utility ceiling: two 50 × 200 trimmers UTR-N / UTR-S about 2.86 m just inside the N/S closings; W end on a hanger to a W edge joist (x ≈ 6.14), E end on the x = +9 beam; N–S joists ~600 c/c, split at the mid purlin; T&G and insulation over the utility interior, sloped 7°. Rev h specified a 10 mm shadow gap; Tom asked for no visible gaps, so T&G closes to the linings (2 mm).
- Ledge: 150 × 30 board, 3.75 m long (equal setback from the earlier ~3.83 m polyline), on six node studs 100 × 50 at ~553 c/c, eight brackets (six studs + centre post + IW-ES). Wall/face still CHECK with Els.
- Utility north door: 800 × 2 100 clear, rough opening 880 × 2 140; UDH 150 × 100 flat, underside 2 140, top 2 240; two cripple studs 150 × 50 × 310 from 2 240 to the plate underside 2 550; 40 mm linings.
- High window as a factory unit (frame, mullion, two sashes, hinges, winder gearbox on the unit). West trimmer remains site framing around the unit.
- Window 1 restrictor at 90° on the west (S-post) jamb, interior, galvanised, about 65 mm clear of the S brace (CHECK).
- Installation studs: four 150 × 50 at 400 c/c, bays 275 / 350 / 350 / 350 / 275 between the post inner faces (1 800 mm); noggings flat, tops at 550 / 1 000 / 1 500 / 2 000; boiler rails doubled 900–1 000 and 1 900–2 000 in bays 1–2.

### Rev i — utility east (installation) wall

Replaces the rev h “boards on battens, no cob” build. Tom wants the utility to look like the building: no boards on battens outside. Outer face is a rendered cob look, flush at CL+125 like the other utility walls: 25 × 8 laths at 40 c/c nailed to the 150 mm frame, then a cob/clay skin and lime render, 50 mm including the laths (about 35 cob + 7 lime). Inner face is 22 mm ply at CL−97, with ~22 × 30 timber stop beads at the two inside corners (~2.6 m each, up to the ceiling). Upper E closing is the same stack, plus one 25 × 38 batten per bay (4 pcs ~350 long) because the upper bays are wider than 400 mm. No laths on the inside.

### Walls closed to the ceiling (Tom)

Els reported visible gaps where walls and coverings stopped short of the T&G. Tom: every wall and everything in it must close fully to the underside of the ceiling or roof, with no gaps. The 20 mm structural slip under the roof covering is kept (walls do not carry roof load). The 1 100 mm kitchen shelf is a worktop and is not raised. The bathroom curtain rail stays at 2 200 mm.

Per-wall notes (drawings vs model):

- House ring, upper closing, utility N/S/W: already reached cover−20 mm. The visible interior slot was mainly the 20 mm T&G inset from the inner skin (rIn). Closed to 2 mm. Matches the drawings on wall height; the inset close-up is per Tom, not the earlier 20 mm slip at the lining.
- Utility east: same roof slip; T&G now closes to the ply (2 mm). Rev h had specified a 10 mm shadow gap — discrepancy, closed per Tom.
- Inner curved wall: drawings stop at 2 375 AFF (closing plate not tied to the roof, CHECK). T&G along the wall is about 3 063–3 507, so a 688–1 132 mm gap was visible and matched the drawings. Per Tom an upper sandwich continues from 2 375 to the soffit (2 mm short of the boards). Drawing discrepancy reported.
- Partitions and closets: 2 200 was ASSUMED, not drawn full-height. T&G about 3 156–3 515, gap 956–1 315 mm. Now closed to the soffit. Drawing / earlier-assumption discrepancy reported.
- Shower tray (50 mm) is not a wall and is unchanged.

### CHECKs still open

- Window 1 sash vs S knee brace (~65 mm).
- High-window lining vs N knee brace (~50 mm).
- Utility door vs back door (218.9 mm as drawn).
- Closet vs window 1 (sketched closet stays by the bed / partition).
- Curtain line (partition end to pier 3).
- Ledge wall/face with Els.
- Insulation product and joist hangers.


## v1r — plan rev 2026-11-26j (every wall closes to the ceiling; uniform limewash)

Drawings: B-01–B-15 rev 2026-11-26j (authoritative), plus the rev j section of `drawings_optionB/answers_timber_rev_g.md`. Roof plan, overhangs and the south gutter are unchanged.

### Height and closure (follow rev j; differences vs v1q reported)

- T&G underside AFF = 3 504 + y·tan 7° (y north +, mm), level E–W. House centre 3 504 (v1q's inner-wall sample of 3 502 was at the house centre, 2 mm shy; the inner wall is not there).
- Curved inner wall upper sandwich to the sloped T&G: **3 507 at the centre post, 3 288 mid-arc, 3 063 at IW-ES** (clear over the head plate 1 132 / 913 / 688). At the centre post the wall closes to the **x = 0 beam soffit (~3 284)**, not the T&G. Six upper studs 100 × 50 at the plate nodes, a 100 × 50 closing plate in 7 sloped pieces on a 10 mm compressible strip, 1 batten 25 × 38 per bay per face. IW-ES full height 100 × 100 × about 2 933 (sole top 70 to the closing plate).
- P1–P3 full height: P1 2.17 m, T&G 3 506 level; P2 2.85 m, T&G 3 506 → 3 156 (mid 3 331; v1q sampled 3 258 at y ≈ −2.0 m); P3 1.62 m, T&G 3 515. 100 × 50 studs, skins ≤ 25 mm each face, no footing (CHECK Tom). Closets: sides to the T&G and a framed bulkhead from 2 100 to the T&G (C1 bed head, C2 by the shower; positions CHECK Els).
- Utility T&G tight to the skins (1 mm to avoid z-fighting). Rev h's 10 mm shadow gap is dropped; v1q had closed it to 2 mm.
- Ring wall under the x = ±5 beams: US 81.5 / 95.1 / 264.9 / 278.5° and UT-08/09/20/21 stop 20 mm under the beam soffit; 100 × 50 under-beam plate along the slope; 50 × 50 packers and skin up to the panels at the beam faces. No notching.
- Geyser: 2.4 m c/c everywhere. The stale 2.6 m in this file (copied from rev g's B-13) is corrected. Other "2.6" figures (brace elevations, HW sill 2 600, plate 2 650) are unrelated.
- All outside walls use the same lime render + limewash material and colour (house ring, utility N/S/W and E), so there is no visible change at the corners.

### CHECKs still open

- Window 1 sash vs S knee brace (~65 mm).
- High-window lining vs N knee brace (~50 mm).
- Utility door vs back door (218.9 mm as drawn).
- Closet position and the curtain line (Els).
- Ledge wall/face (Els).
- Partition skins have no footing (Tom).
- Insulation product and joist hangers.


## v1s — calmer walk and orbit controls

Walk look and move felt twitchy (instant yaw/pitch at 0.0025 rad/px mouse and 0.005 rad/px touch, instant start/stop). v1s lowers the defaults, adds frame-rate-independent damping, and puts a Look sensitivity slider in the top header (after the tool buttons; wraps under them on a phone).

- Mouse look baseline: 0.00115 rad per CSS pixel at 1× (was 0.0025).
- Touch look baseline: 0.00140 rad per CSS pixel at 1× (was 0.005). Scaling is CSS-pixel only (not multiplied by devicePixelRatio).
- Slider: 0.2×–2.0×, default 1.0× of the new baseline, persisted as `localStorage['roundhouse.lookSensitivity']`.
- Look damping time constant: 0.15 s (lerp yaw/pitch toward a target each frame). Pitch is clamped to ±80°.
- Move damping time constant: 0.14 s (acceleration / deceleration of walk velocity, including the on-screen joystick).
- Orbit: `enableDamping` stays on, `dampingFactor` 0.10 (was 0.08), `rotateSpeed` 0.50 (was 1.0).
- Touch look-drag: ignore the first pointermove after pointerdown, clamp per-event deltas (48 CSS px touch / 64 px mouse), handle pointercancel, capture the pointer.
- Teleports (`setMode`, `setWalkView`, `setPlayer`) snap look and zero walk velocity so screenshot helpers stay instant.


## v1t — south gutter lowered to the drip (ASSUMED)

The v1o gutter was genuinely too high, not a perspective effect. The 150 mm half-round, 3 mm/m fall, outlet positions and fascia-bracket spacing are unchanged. Structure (purlins, main-beam ends) stays flush at y = ±6 200 mm.

What was wrong (v1o–v1s):

- The roof covering was flush with the fascia. The top drip sat **6 mm short** of the gutter's back inner rim (underside **14 mm short**), so water would fall behind the trough, not into it.
- The hanging used the *top* of the 60 mm sandwich as the drip, with the crown rim only **22 mm** below that top — which put the rim **38 mm above** the underside of the covering. At the outlets the rim was still **23 mm above** the underside.
- Crown rim AFF 3 000 mm; underside of the flush covering 2 963 mm; top 3 022 mm.

What changed (all still ASSUMED):

- The weather covering (and its underside plane) now projects **50 mm** past the south fascia only. The north eave stays flush (high side, no gutter). Beams and eave purlins are unchanged.
- The gutter is lowered so the **crown** (highest) back rim sits **20 mm** below the underside drip of the extended covering (within the 10–25 mm band). Outlets are **15 mm** lower still (3 mm/m over 5 m), so **35 mm** below the underside.
- With the 50 mm projection, the top drip overhangs about **44 mm** into the trough (underside about **36 mm**), i.e. in the 40–50 mm range measured to the top drip from the back inner rim.
- Brackets and downpipe tops follow the new invert at high and low ends.
- There is no other gutter. The same south run already drains the utility east extension (outlet at the SE-ext post, x = +9.00, stop-end at x = +10.50). The north eave is the high side of the 7° roof; the east and west edges are rakes.

New crown rim ≈ 2 936 mm AFF; outlet rim ≈ 2 921 mm AFF. Underside drip at the new edge ≈ 2 956 mm; top drip ≈ 3 016 mm.


## v1u — Stand/Sit walk, couch view, 180 mm step to grade

The approved rev j2 roof and posts are unchanged (no Option C, no overhang or raise). A plan check of v1t against `src_rev2026-11-26j2` and `geometry.json` found no dimensional discrepancies in posts, walls, openings, roof edges or heights. The only intentional departure from a flush covering at the south fascia is the v1t 50 mm covering projection into the gutter (ASSUMED).

Walk mode:

- Stand/Sit toggle in the top header (visible in Walk mode, after Orbit/Walk): eye height **1.75 m** standing and **1.15 m** seated, above the local floor, eased with a 0.18 s time constant (v1s look/move damping kept).
- Local floor is FFL (0) inside the house and the utility, and **grade (−180 mm)** outside. Crossing an open garden door, back door or utility door eases the 180 mm step over the plinth band (about 0.3 m, 0.16 s time constant).
- **Couch view** (Views panel): seated on the living-room couch at (−1.42, 1.15, 1.60), looking south (yaw π) toward windows 24/25. **ASSUMED** — the couch actually faces west toward the garden, in the SW bay, and is not against the south curved wall. This is the closest sensible seated south view from that couch, used in this one model.


## v1v — joystick look (touch default) and inverted drag

Geometry is unchanged from v1u / rev j2.

Walk look:

- **Joystick look** (default on touch, available on mouse-drag too): on pointer down the touch point is the anchor. While held, the view turns continuously toward the finger's offset — left turns left, right turns right, up looks up, down looks down. A dead zone of **8 CSS px** sits around the anchor; the rate ramps linearly to a maximum at **90 CSS px**. At 1× the max yaw and pitch rates are **90°/s**. The Look sensitivity slider (0.2×–2.0×, persisted) scales both joystick look and drag look. v1s easing (LOOK_TAU 0.15 s) still damps yaw/pitch toward the moving target, so start and stop are smooth; releasing the finger stops the rate. Pitch stays clamped at ±80°.
- **Drag look** is still available via the **Look: Joystick / Drag** toggle in the header, next to the Look sensitivity slider (visible in Walk mode, wraps on a phone without clipping). The choice is persisted as `localStorage['roundhouse.lookMode']`. If none is stored, touch devices default to joystick and others to drag.
- Drag direction was inverted to match the joystick: **drag left turns the view left**, drag right turns right, drag up looks up, drag down looks down. Pointer-lock mouse (desktop click-to-lock) used the same inverted-yaw path as v1s; it is now **standard FPS** (mouse right looks right, mouse up looks up). Unlocked mouse drag matches the touch drag signs.
- The existing move joystick and look use separate pointer IDs, so one thumb can move while the other looks.


## v1w — look-direction signs, cache bust, visible version

Geometry is unchanged. Look rates and the Joystick / Drag toggle are as in v1v.

Tom reported that on his phone, finger left turned the view right (and up looked down) on both axes. That matches the pre-v1v drag signs (v1u: drag left turned right). His phone may still have been serving a cached v1u/v1v index, so v1w makes cache busting explicit and re-checks the signs against the camera's world forward vector, not only internal yaw.

Look signs (joystick and drag, also pointer-lock mouse as standard FPS):

- Finger or drag left: the view turns left. Facing north (yaw 0, looking −Z), the camera forward vector rotates toward −X (west).
- Right: turns right (forward toward +X).
- Up: looks up (forward +Y).
- Down: looks down (forward −Y).

Cache busting:

- `index.html` sends no-cache / no-store / must-revalidate meta tags.
- A `version.json` file holds the live version. An inline script fetches it with `cache: 'no-store'` and, if it does not match the page's baked-in version, reloads with `?v=<live>&_rh=<timestamp>`.
- Asset URLs keep `?v=1w`. Any service worker is unregistered on load.
- A clear terracotta **v1w** badge sits in the header next to the title so the running version is obvious on a phone.


## v1x — garden double doors open outward

The only double door is the **garden pair** (west wall, segment 20, W post as the south jamb, clear 1 910 mm, two leaves 56 % / 44 %). They were labelled "out" but the leaves actually swung inward (local −Z). Both leaves now swing 90° to the outside (local +Z).

Hinges stay on the jambs. Walk collision already lets you through the ring opening when the doors are open; leaf meshes are not colliders (same as before).

The back door (single leaf + south side light) and the utility door are not double doors and were left as they are.

ASSUMED: 90° hold-open; leaves are cut at FFL / the threshold, so they swing clear of the notched plinth (plinth in the door bay is 40 mm below FFL) and open over the 180 mm drop to grade (180 mm of air under the open leaf outside). No west gutter or downpipe. No plan swing-arc mesh is drawn.

## v1y (28 Nov 2026, Roundhouse Control for Tom). Supersedes "plan exactly as drawn / no +20 cm"

Every dimension below is **ASSUMED** until the Roundhouse plan update arrives. Their numbers will replace these.

- **Raise +200 mm (ASSUMED):** the roof, beams, purlins, posts, upper closing and T&G all go up 200 mm (ROOF_RAISE 0.200 → 0.400). Window and door heights are unchanged. The head plate soffit stays at 2 375. The wall above the openings is 200 mm taller.
- **Overhang (ASSUMED):** the reference is the **outside wall face** (R 5.125). S, W and N edges are at 5.125 + 0.750, giving y = ±5.875 and x = −5.875. The E edge is at 9.850: the outer face of the x = 9.00 ext posts (9.10) + 0.750. The roof cover laps 50 mm into the S gutter (this was already the case). The beams are trimmed 30 mm so their square-cut ends stay inside the edge.
- **End posts (ASSUMED):** the corner and ext posts move from y ±5.0 to y ±5.675, so the beam overhangs 200 mm past the post centreline. The eave purlin centreline is at ±5.800 (outer face flush with the roof edge, inner face 5.725). Braces give 50 mm bearing.
- **Braces (ASSUMED):** "normal" 45° knee braces. Each corner post (SW, NW, SE, NE, SE-ext, NE-ext) has 2 braces: one N–S (under the eave purlin) and one E–W (under the beam line). The ring posts keep their v1t braces.
- **Shed / utility, attached (ASSUMED):** the shed shares the house wall with no gap and sits over bays 6–8 (θ ≈ 58°–90°).
  - N wall centreline y −0.025. Its outer face is flush with the y = 0 E post face (+0.1), so the back door is unaffected.
  - S wall centreline y −2.590. E wall centreline x 9.000; the x = 9.00 E post is built into the E wall.
  - Interior is about 2.32 m N–S and 3.75–4.39 m E–W, against Tom's note of 2.15 × 3.3–3.7 (bigger because it is sized to the E windows and posts). Floor is at FFL.
  - Shed plate is at 2 850. The ceiling is N–S joists at 600 c/c with T&G.
- **Shed door (ASSUMED):** in the E wall, opening y −0.300 to −1.180 (880 wide, 800 clear). Door height 2 100, head 2 140, hinged north, opening outward to the east. A vent louvre sits above the door at about 2 450.
- **Kit in the shed (ASSUMED):** boiler and geyser on the E wall south of the door; battery at x 6.2 and inverter on the S wall.
- **Bathroom fan F1 (ASSUMED):** moved from bay 8 (which now faces into the shed) to bay 5, θ 52.2°, at 2 700.
- **Kitchen (ASSUMED):**
  - Peninsula 900 × 2 400 × 900 high, x 0.30–1.20, y +2.30 to +4.70. Only its N short end touches the straight N wall.
  - Gas hob on a 600 × 600 base unit against the straight N wall under window 15 (centre x ≈ −0.55); hob 600 × 520.
  - The 60-year-old woman in red stays at the hob.
- **Low vents (ASSUMED, 50 mm-ish louvres):**
  - VL1 bathroom, bay 3, θ 35.1°, at 500.
  - VL2 living, bay 16, θ 195.5°, at 500.
  - VL3 living, bay 9, θ 92.4°, at **250**. This is the panel under the back-door side light; there is no other living cob bay, so it is low.
  - VL4 next to the kitchen, bay 13, θ 159.8°, at 500.
- **High vents (ASSUMED):** VH1 θ 24°, VH2 θ 131° and VH3 θ 294°, all at 2 850 in the round wall above the head plate.
- **Outside taps (ASSUMED):** one on the shed S wall (x 7.2, 550 high) and one on the house wall at θ 157.5° near the kitchen (550 high).
- **Gutter (as v1t, re-levelled):** 150 half-round, 3 mm/m fall to outlets at the SW, SE and SE-ext posts (x −5, 5, 9), with 100 mm downpipes. Front at 5.96 catches the drip line (cover laps 36–44 mm into the gutter).

## v1z (28 Nov 2026): aligned to rev 2026-11-28k (Control's corrections). Rev k wins. Supersedes the v1y figures above where they differ

**From rev k (not assumed):**
- **Roof:** 15.5 × 11.5 m. Eaves y = ±5.750, west x = −5.750, east x = +9.750. The overhang is 750 from the in-wall post line (S/W/N) and 750 past the x = +9 posts on the east.
- **End posts:** corner and end-eave posts at y = ±5.550 (200 mm of beam left past the post). Eave purlin CL ±5.675, outer face ±5.750.
- **Braces:** corner and end-eave posts have 2 braces each, one along each wall line. The outward E–W braces are omitted.
- **Roof underside above FFL:** S wall 3.310, centre 3.924, N wall 4.538. This is the top of the purlins, the model's "cover" datum, so no change was needed from v1y. Openings stay at 400 / 2 300 and the head plate stays 2 375.
- **Shed:** joined to the east cob wall (bays 6–8). N wall at y = 0, S wall at y = −2.550 (about 200 mm clear of bathroom window 5), E wall on x = +9.000. Door faces east with an 800 clear opening. New posts at SW and SE only.
- **Kitchen:** hob box at the straight N wall beside the N post. The granite counter is 650 wide and runs south 2 400 from the wall (length ASSUMED, CHECK). Only the short end touches the wall.
- **Vents:**
  - LV-B bay 3, LV-K bay 16, LV-L1 and LV-L2 in bay 26, all low at about 500.
  - HV-S (bay 26), HV-W (bay 22) and HV-E (bay 13).
  - SV-E above the shed door.
- **Taps:** T1 on the shed east wall south of the door. T2 on the W garden plinth south of the garden doors (bay 21).

**Still ASSUMED (not in rev k):**
- Shed door: hinged on the N side, opening y −1.180 to −0.300 (880 wide, 800 clear), 2 100 high, head 2 140, opens outward east.
- SW shed post at (x 4.60, y −2.550), 200 × 200, just outside the ring face. SE shed post at (9.000, −2.550).
- Shed plate 2 850. The ceiling is N–S joists at 600 c/c under the T&G. The N wall stops under the y = 0 purlin.
- Shed kit positions: boiler and geyser on the E wall south of the door; battery at x 6.2 and inverter on the S wall.
- SV-E louvre 200 × 120 at about 2 450 above the door.
- Peninsula at x −0.770 to −0.120 (20 mm off the N post, post face x −0.100). The hob (600 × 520) sits on its north end, 330 from the wall. The woman in red stands west of it at (−1.20, 4.25), facing east.
- Vent positions inside each bay: LV-L1 θ 351.9°, LV-L2 θ 357.1°, HV-S θ 354.5° (bay 26); LV-B θ 35.1°; LV-K θ 195.5°; HV-W θ 294.2°; HV-E θ 161.2°.
- High vents at 2 850 AFF. Low vents at 500 AFF, not the 450 on the old B-06 note. Louvre Ø100 with a 250 sleeve.
- T1 at x 9.125, y 1.75 (z), 600 high. T2 at θ 276° on the wall face, 600 high (AFF, not above grade).
- F1 shower fan: moved to bay 5 (θ 52.2°) at 2 700. Rev k keeps it "high in bay 8", but bay 8 is now inside the shed (FLAG).
- The roof covering keeps its 50 mm drip lip past the south fascia (v1t) so it drips into the gutter. Everything else, including the N, W and E edges, stops at the roof edge.

**Removed from v1y:** the vent under the back-door side light (250 mm), the 900 × 2 400 peninsula at x 0.30–1.20, the 600 × 600 hob base, the kitchen tap, and the v1y overhang edges (±5.875 / 9.850).

## v1z1 (28 Nov 2026): sink box as on B-06. Everything else stays as v1z.

Control confirmed items 1, 2, 3, 5 and 6 of the v1z report (F1 in bay 5, low vents at 500, shed plate 2 850, T2 in bay 21 at 600 AFF, shed door 2 100 / head 2 140). Those stay as modelled.

**Sink box (ASSUMED — Els still has to give the kitchen block sizes):**
- Drawn as on B-06, east of the N post, along the straight N wall.
- Plan: x +0.430 to +0.920 (490 mm wide, about 0.5 m), 3.000 m into the room from the wall face (wall at y 4.70 / z −4.70, south end at y 1.70 / z −1.70).
- Counter 900 high, with a stainless sink bowl near the wall (bowl 360 × 400, 160 deep, centred on the top, 450 mm from the wall). Bowl size and position ASSUMED.

## v1z2 (28 Nov 2026): Tom’s kitchen correction. Sink box removed; freestanding cooker.

The B-06 sink box (x +0.43 to +0.92, 0.5 × 3 m) and its bowl are removed. There is one counter only.

**Peninsula (unchanged from v1z / rev k):** 650 × 2 400, short end on the straight N wall, x −0.770 to −0.120 (20 mm off the N post). Height 900. The top is plain granite — nothing is set into it (no hob, no sink).

**Freestanding gas cooker (ASSUMED):** a typical 600 × 600 × 900 unit, flush beside the peninsula’s wall end, against the N wall (x −1.370 to −0.770, z −4.70 to −4.10), under the west side of window 15. Four burners, oven door facing south into the room. The woman in red stands in front of it at (−1.07, −3.72), facing north.

**CHECK — cooker past the west end of the straight wall:** 600 mm (cooker) + 650 mm (peninsula) = 1 250 mm, but only 1 195 mm of straight wall remains west of the N post (wall ends at x −1.295). The cooker’s west 75 mm therefore goes past the wall end. At that corner the back sits about 21 mm into the curved ring (bay 16). Placement is ASSUMED; Els to confirm the kitchen sizes.

## v1z3 (28 Nov 2026): aligned to rev 2026-11-28k2. Kitchen stays as v1z2.

k2 figures used exactly:
- **Braces:** N-N legs 440; W-W and EX-E legs 520; all other legs stay 600. The N–S brace at the N post is 25 mm east of the post centreline (section x −25 to +75), giving 75 mm clear of the high-window east reveal. Flitch plates (Connections rev n: pair of 80×8×250 S235 HDG, 2 × M16 at each foot and the 26 screwed heads) are not modelled (optional; CHECK engineer).
- **SW shed post:** (4.701, −2.550), 400 mm east of the previous 4.600, clear of SP-06 / HP-06 / UT-06.
- **Shed door jambs:** 150 mm timber jamb in the 200 mm north pier (50 mm left to the E-ext south face). A matching 150 mm south jamb is shown so the 1 120 mm clear (SE-util to the south jamb) is visible. Opening stays RO 880 / 800 clear × 2 100.
- **UTP-N:** housed 30 mm into the E and E-ext posts and side-fixed to their south faces; it does not run over the post tops (those posts continue to the beam). The east plate is housed into E-ext the same way and still sits on SE-util.
