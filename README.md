# Varicon Prototypes

A shared space for the team to propose, review, and discuss UI improvements to the Varicon platform.

Anyone on the team can contribute a prototype here — you don't need to write production code or file a formal spec. If you have an idea for how something could work better, build a quick HTML mockup and push it here.

## How it works

1. **Create a folder** named `YYYY-MM-DD-short-description` (e.g. `2026-03-23-onboarding-wizard`)
2. **Add an `index.html`** with your prototype — static HTML/CSS is all you need
3. **Push to `main`** — GitHub Pages will auto-publish it within a minute
4. **Share the link** with the team for feedback

All prototypes are viewable at: **https://varicon-naxa.github.io/prototypes/**

Each folder is accessible at `https://varicon-naxa.github.io/prototypes/<folder-name>/`

## Guidelines

- **Keep it simple** — the goal is to communicate an idea, not build a finished product
- **One idea per prototype** — easier to discuss and review
- **Include context** — add a comment at the top of your HTML or a short `notes.md` explaining what problem you're solving
- **Iterate openly** — if you want to improve on someone else's prototype, create a new folder (e.g. `2026-03-25-onboarding-wizard-v2`)

## Quick start

```bash
git clone https://github.com/varicon-naxa/prototypes.git
cd prototypes
mkdir 2026-03-24-my-idea
# create your index.html
git add .
git commit -m "Add my-idea prototype"
git push
```

Your prototype will be live at `https://varicon-naxa.github.io/prototypes/2026-03-24-my-idea/`
