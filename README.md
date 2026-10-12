# CompSimu

Interactive, step-by-step simulations that help students learn computer science and programming.

The site is plain static HTML/CSS/JS with no build step, so it can be hosted directly on GitHub Pages.

## Structure

```
index.html                        Landing page and simulation library
assets/css/site.css               Shared design tokens, nav, footer, buttons, cards
assets/css/simulation.css         Shared simulation UI (code panel, memory stage, controls)
assets/img/logo.svg               Favicon / logo
simulations/python-swap/index.html  Swapping two variables in Python (temp-variable method)
```

All links are relative, so the site works both at a custom domain root and under a GitHub Pages project path (`https://<user>.github.io/CompSimu/`).

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## Adding a simulation

1. Create `simulations/<your-simulation>/index.html`.
2. Link `../../assets/css/site.css` and `../../assets/css/simulation.css`, and copy the nav/footer markup from an existing simulation.
3. Add a card for it in the `#simGrid` section of `index.html`.

## Design

Visual style follows the Mintlify design system from [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md/tree/main/design-md/mintlify): Inter + Geist Mono, black pill buttons, a sparing mint accent, a sky-gradient hero, and flat hairline cards.
