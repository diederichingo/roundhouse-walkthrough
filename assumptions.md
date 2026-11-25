# Roundhouse walkthrough v1 — assumptions

Every item below is an assumption used in the 3D model. Confirmed dimensions come from the Option B B-sheets and `/workspace/roundhouse/dimensions.md`. Assumed items are also listed in the walkthrough UI.

## Instructed assumptions (from the build brief)

- House, utility and the kitchen under-sill walls are a **250 mm sandwich**: 150 mm timber frame with insulation and up to 50 mm cob/plaster skin each face, centred on the centreline, on the 400 mm plinth (75 mm reveal each side). Confirmed by Roundhouse Control, 25 Nov 2026. The outer finish is still called cob/plaster.
- Curved inner wall: **200 mm × 2 355 mm (unconfirmed / CHECK)** — 100 mm frame + 50 mm skin each face, flush with the 200 mm plinth, from plinth top (20 mm AFF) to the outer head-plate soffit (2 375 mm AFF). **100 × 50 sole on DPC**, **100 × 50 head** (closing plate, not tied to the roof), **100 × 100 × 2 355 mm** full-height end post on the plinth. Intermediate 100 mm studs are not added (battens do that work; CHECK if Joshua adds 100 × 50 studs later). Interior partitions that are not this wall stay 2 200 mm.
- Kitchen window: **900 mm wide × 1 100 mm high**, sill **1 200** (size and sill still assumed), against the N post, above the counter. The window top is the confirmed **2 300 mm** (all window tops at one height).
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
