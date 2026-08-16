# RiX-Web standard calculator profile

RiX-Web starts ordinary sessions with a small, checked-in RiX prelude. The
authoritative file is [`standard-profile.rix`](standard-profile.rix). It keeps
one directly selected plugin per line and uses lexical selective imports, so
the same file is readable configuration and executable RiX source.

The profile is deliberately a calculator baseline, not the whole bundled
catalog. Plugin dependencies are loaded automatically.

| Plugin | Bare names supplied by the profile |
| --- | --- |
| `numerics` | Roots/powers and `Hypot`; exponential/logarithmic functions; circular and hyperbolic trig including `Atan2`; angle conversion; Gamma/Beta/polygamma functions; `Erf`, `LambertW`, `Zeta`; constants `Pi` and `EulerGamma`; `Refine` |
| `bessel` | No bare imports; use `.bessel.J0`, `.bessel.J1`, `.bessel.Y0`, and `.bessel.Y1` so the letter-and-order names stay clear. |
| `float` | `Round`, `Floor`, `Ceiling` |
| `algebra` | `Polynomial`, `Coefficients` |
| `linalg` | `Rref`, `Rank`, `Determinant`, `Inverse`, and `LinearSolve` (alias of `Solve`) |
| `solve` | No bare imports; use `.solve` to avoid reserving generic names. |
| `stats` | `Count`, `Mean`, `Quantile`, `Median`, `Variance`, `SampleVariance` |
| `plot` | `GraphPolynomial` (alias of `Polynomial`) |
| `draw` | `DrawLine`, `Polygon`, `Label`, `Box`, `DrawCircle` |
| `geometry` | `Point`, `Line`, `Circle`, `Midpoint`, `PerpendicularBisector`, `Circumcircle`, `Intersect` |
| `data` | No bare imports; use `.data` to avoid reserving generic names. |
| `radix` | No bare imports; its receiver methods and `.radix` namespace are available. |

These roots, elementary functions, and special functions are backend-neutral
certified Numerics operations. Angles and inverse-trig results use radians. The Float
plugin remains loaded for explicit binary64 conversion and rounding, but it no
longer supplies the standard profile's bare trig names. Names with likely
collisions are intentionally aliased.

## URL selection

The default URL uses the standard profile. These query parameters alter it:

- `?plugins=fresh` starts with no profile plugins or bare imports.
- `?plugins-add=document,csv` adds catalog plugins to the selected base.
- `?plugins-remove=stats,data` removes direct entries from the standard base.
- Parameters may be combined or repeated, for example
  `?plugins=fresh&plugins-add=numerics,plot`.

An added plugin is loaded under its normal dotted mount but does not receive
new bare aliases. Add any desired lexical imports in the script itself, such as
`.document[:Report]`. Removing a direct entry does not suppress a plugin if a
remaining plugin requires it as a dependency.

Unknown additions are ignored with a status warning. Example/teaching plugins
remain explicit unless named by `plugins-add`.

## Saving and command-line portability

**Save** writes a `.rix-session` JSON snapshot containing the effective profile,
command history, settings, draft, and reactive inputs. Restoring that snapshot
restores its profile even when the page URL has different defaults.

**Export .rix** writes executable RiX source. It includes a `plugins` source
header for the CLI, the effective selective-import prelude, number settings,
executed commands, and final reactive input values. Run it with:

```sh
rix ratcalc-YYYY-MM-DD.rix
```

The generated prelude is enclosed by `RIX-WEB-PROFILE-BEGIN` and
`RIX-WEB-PROFILE-END` comments. A RiX-Web host that already applied the saved
profile may strip that block before replay, avoiding redundant idempotent loads.
The unexecuted input draft is preserved as comments.

The exporter keeps the complete effective profile rather than guessing which
plugins a command used. Receiver methods, aliases, generated code, and plugin
dependencies make usage inference unreliable; the explicit profile is small
and guarantees portable replay.

## Updating the baseline

When a plugin becomes part of normal calculator expectations, add one line to
`standard-profile.rix`, choose collision-free bare imports, update the table
above, and add a focused runtime assertion. The rest of the catalog remains
available through `.Plugin.List()` and `.Plugin.Load(...)`.
