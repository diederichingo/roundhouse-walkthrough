# Roundhouse walkthrough v1 — assumptions

Every item below is an assumption used in the 3D model. Confirmed dimensions come from the Option B B-sheets and `/workspace/roundhouse/dimensions.md`. Assumed items are also listed in the walkthrough UI.

## Instructed assumptions (from the build brief)

- House and utility walls are modelled as **350 mm cob**, centred on the centreline. Tom wants this called just “cob” with no stated thickness; 350 mm is a modelling assumption only and is not labelled in the walkthrough except in the Assumed list.
- Curved inner wall thickness: **250 mm**, centred on the drawn arc.
- Kitchen window: **900 mm wide × 1 100 mm high**, sill **1 200** (size and sill still assumed), against the N post, above the counter. The window top is the confirmed **2 300 mm** (all window tops at one height).
- Finished floor level: **180 mm above grade** (drawn provisional in the plan).
- Green sandwich roof panel thickness: **60 mm**, measured normal to the 7° plane.
- Window / door frame depth: **70 mm**.
- Site: **level** (no topography in the drawings).

## Further assumptions made to build the model

- Curved inner wall and unfounded interior partitions (bathroom / bed wall, shower / closet wall, closet sides) are **2 200 mm** high above FFL.
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
- Upper closing: non-load-bearing cob/render from the head-plate top (2 475 mm) up to the roof underside minus the **20 mm** slip joint, following the 7° plane with y.
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
- The living room grouping (two-seat couch about 1 600 × 850 × 800, coffee table 900 × 500 × 400, Eames lounge 840 × 850 × 830, dark leather and walnut) is typical furniture for a sense of space, not from the drawings. It sits in the south-west bay, south of the path to the west garden doors. The Eames ottoman that was in v1h was removed in v1i. The walkway from the couch to the garden-door south jamb is 800 mm.
