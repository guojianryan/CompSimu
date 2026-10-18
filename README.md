# CompSimu

Interactive, step-by-step simulations that help students learn computer science — from programming constructs to theoretical topics.

The site is plain static HTML/CSS/JS with no build step, so it can be hosted directly on GitHub Pages.

## Structure

```
index.html                              Landing page and simulation library
assets/css/site.css                     Shared design tokens, nav, footer, buttons, cards
assets/css/simulation.css               Shared simulation UI (code panel, memory stage, controls)
assets/css/viz.css                      Array / bar / stack / queue visualizations
assets/js/sim-player.js                 Shared step / play / reset controller
assets/img/logo.svg                     Favicon / logo
simulations/python-swap/index.html      Swapping two variables (temp-variable method)
simulations/array-sum/index.html        Totalling an array (accumulator)
simulations/count-occurrences/index.html Counting occurrences
simulations/max-min/index.html          Finding max and min
simulations/linear-search/index.html    Linear search
simulations/parallel-arrays/index.html  Parallel arrays (linear search lookup)
simulations/binary-search/index.html    Binary search
simulations/bubble-sort/index.html      Bubble sort
simulations/selection-sort/index.html   Selection sort
simulations/stacks/index.html           Stacks (LIFO)
simulations/queues/index.html           Queues (FIFO)
simulations/ir-door-sensor/index.html   Infrared door sensor (sense → decide → act)
simulations/fetch-execute-cycle/index.html Fetch–execute cycle (CPU registers + RAM)
```

Every interactive stage shows **labeled variable boxes** so students can see how `i`, accumulators, pointers, and results change step by step.

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
