# Linux Bash Starter Wiki
A beginner-friendly static website that teaches practical Linux Bash tasks with copy-ready scripts, simple explanations, safety notes, and rollback guidance.

## What this project includes
- Script library with categories:
  - Networking
  - System Identity
  - Permissions & Files
  - Users & Passwords
  - Services
  - Disk & Cleanup
  - Logs & Troubleshooting
  - Backup & Restore
  - Updates & Security
- Per-script details:
  - Risk level
  - `sudo` requirement
  - Prerequisites
  - Step-by-step usage
  - Expected output
  - Rollback/recovery notes
- One-click actions:
  - Copy script to clipboard
  - Download script as `.sh`
- Beginner guide page with glossary and troubleshooting tips.

## Project structure
```text
linux-bash-wiki/
├── index.html
├── guide.html
├── styles.css
├── app.js
└── data/
    └── scripts.json
```

## Run locally
From the project directory:

1. Start a simple web server:
   - `python3 -m http.server 8000`
2. Open in browser:
   - `http://localhost:8000`

Using a local web server is recommended because browsers may block `fetch()` from `file://` URLs.

## Run with Docker
From the project directory:

1. Build the image:
   - `docker build -t linux-bash-wiki .`
2. Run the container:
   - `docker run --rm -p 8000:80 linux-bash-wiki`
3. Open in browser:
   - `http://localhost:8000`

## Add or edit scripts
All script content lives in `data/scripts.json`.

Each script entry should contain:
- `id`
- `title`
- `category`
- `risk` (`low`, `medium`, `high`)
- `requires_sudo` (`true`/`false`)
- `filename`
- `summary`
- `tags` (array)
- `prerequisites` (array)
- `steps` (array)
- `expected_output` (array)
- `rollback` (string)
- `notes` (array)
- `script_lines` (array of shell lines)

## Deploy options
Because this is a static site, you can deploy it to:
- GitHub Pages
- Netlify
- Vercel (static)
- Any basic web server (Nginx/Apache/Caddy)

## Safety reminder
Scripts in this project are educational starters. Always review commands before running them, especially scripts marked high risk or requiring `sudo`.
