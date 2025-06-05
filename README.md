# Factor_KS Stream Archive

Eine moderne Web-Anwendung für das Archivieren und Verwalten von Twitch-Streams mit integriertem Chat-Replay und Admin-Panel.

## Features

### 🎮 Video Player
- Custom HTML5 Video Player mit vollständigen Kontrollen
- HLS-Streaming-Unterstützung
- Qualitätsauswahl
- Vollbild-Modus
- Progress Bar mit Zeitvorschau
- Volume Control

### 💬 Chat Integration
- Live Chat-Replay synchronisiert mit dem Video
- Twitch-Chat-Parser für .txt Dateien
- Emote-Unterstützung
- Benutzer-Badges und Farben
- Auto-Scroll-Funktionalität

### 📊 Admin Panel
- Stream-Upload und -Verwaltung
- Thumbnail-Processing (automatische Skalierung auf 320x180)
- Stream-Bearbeitung mit Modal-Interface
- Tag-System für Kategorisierung
- Release-Type-Verwaltung (Public/Private/Unlisted)
- Analytics-Dashboard

### 🎨 Responsive Design
- Mobile-optimierte Benutzeroberfläche
- Dark Theme
- Moderne CSS-Animationen
- Grid-basiertes Layout

## Installation

1. Repository klonen:
```bash
git clone [repository-url]
cd projekt3
```

2. Einen lokalen Webserver starten:
```bash
# Mit Python
python -m http.server 8000

# Mit Node.js (http-server)
npx http-server

# Mit PHP
php -S localhost:8000
```

3. Im Browser öffnen:
```
http://localhost:8000
```

## Projektstruktur

```
├── index.html          # Hauptseite mit Stream-Archiv
├── stream.html         # Stream-Player-Seite
├── admin.html          # Admin-Panel
├── streams.html        # Stream-Übersicht
├── analytics.html      # Analytics-Dashboard
├── css/
│   ├── style.css       # Hauptstyles
│   ├── player.css      # Video Player Styles
│   ├── admin.css       # Admin Panel Styles
│   ├── chat.css        # Chat Styles
│   └── ...
├── js/
│   ├── app.js          # Hauptanwendung
│   ├── player.js       # Video Player Logic
│   ├── admin.js        # Admin Panel Logic
│   ├── chat.js         # Chat Funktionalität
│   └── ...
└── README.md
```

## Verwendung

### Stream hinzufügen
1. Admin-Panel öffnen (`/admin.html`)
2. "Stream hinzufügen" auswählen
3. Video-Datei, Chat-Datei (.txt) und Thumbnail hochladen
4. Metadaten eingeben (Titel, Beschreibung, Tags)
5. Release-Type auswählen
6. Stream speichern

### Stream bearbeiten
1. Im Admin-Panel auf "Bearbeiten" bei einem Stream klicken
2. Gewünschte Änderungen vornehmen
3. Speichern

### Chat-Format
Die Chat-Dateien sollten im folgenden Format vorliegen:
```
[HH:MM:SS] Username: Nachricht
[HH:MM:SS] Username: Nachricht mit Emotes Kappa
```

## Technische Details

### Unterstützte Formate
- **Video**: MP4, WebM, OGV
- **Chat**: TXT (Twitch-Chat-Export)
- **Thumbnails**: JPG, PNG, WebP (automatisch auf 320x180 skaliert)

### Browser-Kompatibilität
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Datenspeicherung
- Alle Daten werden im Browser's localStorage gespeichert
- Keine Server-seitige Datenbank erforderlich
- Thumbnails werden als Base64 gespeichert

## Features im Detail

### Custom Video Player
- Vollständig anpassbare Kontrollen
- Keyboard-Shortcuts (Leertaste für Play/Pause, Pfeiltasten für Seek)
- Touch-Unterstützung für mobile Geräte
- Automatische Qualitätserkennung

### Chat-System
- Echtzeit-Synchronisation mit Video
- Emote-Rendering
- Benutzer-Highlighting
- Scroll-to-current-time Funktionalität

### Admin-Interface
- Drag & Drop Upload
- Batch-Operations
- Stream-Statistiken
- Export/Import-Funktionalität

## Entwicklung

### Lokale Entwicklung
1. Repository klonen
2. Lokalen Server starten
3. Änderungen in den entsprechenden CSS/JS-Dateien vornehmen
4. Browser-Cache leeren und neu laden

### Code-Struktur
- **Modularer Aufbau**: Jede Funktionalität in separaten Dateien
- **ES6+ Features**: Moderne JavaScript-Syntax
- **CSS Grid/Flexbox**: Responsive Layouts
- **Progressive Enhancement**: Funktioniert auch ohne JavaScript (Basis-Funktionalität)

## Lizenz

MIT License - siehe LICENSE-Datei für Details.

## Beitragen

1. Fork des Repositories erstellen
2. Feature-Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add some AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request erstellen

## Support

Bei Fragen oder Problemen bitte ein Issue erstellen.