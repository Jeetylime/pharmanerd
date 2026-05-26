# PharmaNerd

**Pharmacology Encyclopedia** — an interactive, client-side web application for browsing, comparing, and exploring detailed pharmacological data on 90+ drugs.

PharmaNerd provides a clean, searchable interface to learn about drug mechanisms, receptor interactions, timelines, pharmacokinetics, legal status, and more. It's a resource for harm reduction, pharmacology enthusiasts, students, and curious minds.

## Features

- **Browse the Pharmacopeia** — Explore 90+ drugs sorted by name, potency, duration, or half-life.
- **Compare Drugs** — Side-by-side comparison across dimensions like potency, duration, half-life, bioavailability, and receptor profiles.
- **Receptor Explorer** — Visual reference of drug-receptor interactions with affinity data.
- **Class Browser** — Browse drugs grouped by pharmacological class (Opioid, Stimulant, Psychedelic, Dissociative, etc.).
- **Interaction Checker** — Check potential drug-drug interactions between substances.
- **History Timeline** — View historical context and discovery timelines for various drugs.
- **Stash / Favorites** — Save drugs to a personal "stash" for quick reference.
- **Global Search** — Search any drug by name or alias from the top navigation bar.
- **Surprise Me** — Jump to a random drug detail page.
- **Intelligent Sorting** — Sort the browse view by Name, Potency, Duration, or Half-Life.
- **Guided Tutorial** — Interactive tour to help new users get started.
- **Settings** — User-configurable preferences (persisted via local storage).

## Drug Classes Covered

| Class            | Icon                     |
|------------------|--------------------------|
| Opioid           | `opioid.svg`             |
| Benzodiazepine   | `benzo.svg`              |
| Stimulant        | `stimulant.svg`          |
| Psychedelic      | `psychedelic.svg`        |
| Dissociative     | `dissociative.svg`       |
| Empathogen       | `empathogen.svg`         |
| Cannabinoid      | `cannabinoid.svg`        |
| Depressant       | `depressant.svg`         |
| Antidepressant   | `antidepressant.svg`     |
| Antipsychotic    | `antipsychotic.svg`      |
| Nootropic        | `nootropic.svg`          |

## Tech Stack

| Layer     | Technology                     |
|-----------|--------------------------------|
| Frontend  | Vanilla HTML, CSS, JavaScript  |
| Backend   | Node.js (built-in `http`/`https` modules) |
| Database  | SQLite3                        |
| Icons     | Custom SVG icons per drug class|


## Live Site

[https://www.pharmanerd.onrender.com](https://www.pharmanerd.onrender.com)

## Quick Start

### Prerequisites

- Node.js 16+
- npm

### Install & Run

```bash
git clone https://github.com/Jeetylime/pharmanerd.git
cd pharmanerd
npm start
```

Then open your browser to [http://localhost:5173](http://localhost:5173).

### Development

Simply edit the HTML, CSS, or JS files and reload the browser. The server uses Node's built-in `http` module — no build step required.

```bash
# Start with default port (5173)
npm start

# Or specify a custom port
PORT=8080 node server.js
```
```

## Database

PharmaNerd uses a SQLite database located at `server/db.js` (a self-contained JS module exporting drug data and interaction tables). The database includes:

- Drug monographs with pharmacokinetics, mechanisms, and safety data
- Drug-drug interaction records
- Receptor binding affinity tables
- Drug classification data

## Contributing

Contributions are welcome! Open an issue or submit a pull request on [GitHub](https://github.com/Jeetylime/pharmanerd).

## License

This project currently has no license. All rights reserved by [Jeetylime](https://github.com/Jeetylime).

---

## Disclamer 

 PharmaNerd is an educational reference tool only. It is not a substitute for professional medical or pharmaceutical advice.

 Readme & code generated in part by
    deepseak-v4-flash
    claude sonnet 4.6
    chatgpt codex 5.2 