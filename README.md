# Image Tool

Eine Rails-Anwendung zum Hochladen und Verarbeiten von Bildern. Konvertiert Fotos in Schwarz-Weiß-Aufnahmen mit zwei verschiedenen Stilen: **Starker Kontrast** und **Flaches Grau**.

## Features

- Drag & Drop Bildupload
- Schnelle Bildverarbeitung mit libvips
- Interaktive Helligkeitsvisuallisierung (Histogramm)
- Vollständig responsive
- Zwei Schwarz-Weiß-Stile zur Auswahl
- Direkte Download-Funktion für verarbeitete Bilder
- Keine Datenspeicherung – alle Bilder werden temporär verarbeitet

## Tech Stack

- **Ruby:** 3.4.8
- **Rails:** 8.1.2
- **CSS Framework:** Bootstrap 5.3.8
- **Bildverarbeitung:** libvips (via `image_processing` gem)
- **Charts:** Chart.js

---

<details>
<summary><strong>Lokale Installation</strong></summary>

### Systemvoraussetzungen
- Ruby 3.4.8
- Node.js & Yarn
- **libvips** (Pflicht für Bildverarbeitung)
  - macOS: `brew install vips`
  - Ubuntu (empfohlen): `sudo apt-get install libvips-dev`
  - Windows: [Installationsanleitung](https://www.libvips.org/install.html)

### Installation

1. **Repository klonen:**
   ```bash
   git clone <repository-url>
   cd image_tool
   ```

2. **Dependencies installieren:**
   ```bash
   bundle install
   yarn install
   ```

### Server starten

Nutze `bin/dev`, um Rails-Server und CSS-Watcher gleichzeitig zu starten:

```bash
bin/dev
```

Die Anwendung ist dann unter [http://localhost:3000](http://localhost:3000) erreichbar.

</details>


<details>
<summary><strong>Docker</strong></summary>

1. **Repository klonen:**
   ```bash
   git clone <repository-url>
   cd image_tool
   ```


2. **Image bauen:**
   ```bash
   docker build -t image_tool .
   ```


3. **Konfiguration (Einmalig):**
   Erstelle eine Datei `.env.production` im Hauptverzeichnis, um den Container plattformunabhängig (Windows/Mac/Linux) starten zu können:

   ```text
   # .env.production
   SECRET_KEY_BASE=generiere_hier_einen_langen_hex_code
   RAILS_SERVE_STATIC_FILES=true
   RAILS_LOG_TO_STDOUT=true
   ```
   
*(Tipp: Einen Key kannst du mit `openssl rand -hex 64` generieren)*


4. **Container starten:**
   ```bash
   docker run -d -p 80:80 --env-file .env.production --name image_tool image_tool ./bin/rails server -b 0.0.0.0 -p 80
   ```


Die App ist dann unter [http://localhost](http://localhost) erreichbar.

### Container Verwaltung

| Aktion | Befehl |
|--------|--------|
| **Logs anzeigen** | `docker logs -f image_tool` |
| **Stoppen** | `docker stop image_tool` |
| **Starten** | `docker start image_tool` |
| **Entfernen** | `docker rm -f image_tool` |

</details>

---

## Projektstruktur

```plaintext
app/
├── controllers/
│   └── image_processor_controller.rb     # Logik für Upload & Verarbeitung
├── views/
│   └── image_processor/index.html.erb    # UI für Upload & Ergebnis
├── javascript/controllers/
│   ├── image_processor_controller.js     # State-Management
│   ├── dropzone_controller.js            # Drag & Drop Logik
│   └── histogram_controller.js           # Chart.js Visualisierung
└── assets/stylesheets/                   # Bootstrap & Custom CSS
```