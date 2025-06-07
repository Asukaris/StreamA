# Datenbank-Einrichtung

## Warum ist keine Datenbank im Repository?

Die Datenbank-Dateien (`*.db`, `*.sqlite`, `*.sqlite3`) werden bewusst **nicht** in der Versionskontrolle gespeichert, da:

- **Sicherheit**: Datenbanken können sensible Benutzerdaten enthalten
- **Größe**: Datenbank-Dateien können sehr groß werden
- **Konflikte**: Verschiedene Entwickler würden ständig Merge-Konflikte haben
- **Umgebungen**: Jede Umgebung (Development, Testing, Production) sollte ihre eigene Datenbank haben

## Automatische Datenbank-Erstellung

Die Anwendung erstellt automatisch eine neue SQLite-Datenbank beim ersten Start:

1. **Speicherort**: `api/data/app.db`
2. **Automatische Erstellung**: Die `Database`-Klasse in `api/database.php` erstellt alle notwendigen Tabellen
3. **Erste Nutzung**: Beim ersten API-Aufruf wird die Datenbank initialisiert

## Manuelle Einrichtung (falls nötig)

Falls die automatische Erstellung nicht funktioniert:

```bash
# Erstelle das data-Verzeichnis
mkdir -p api/data

# Setze Berechtigungen (Linux/Mac)
chmod 755 api/data
```

## Ersten Admin-Benutzer erstellen

Nach der Installation:

1. Führe `make_admin.php` aus
2. Oder nutze die Batch-Datei `make_admin.bat` (Windows)
3. Oder nutze `make_admin_xampp.bat` für XAMPP-Umgebungen

## Backup und Migration

Für Produktionsumgebungen:

```bash
# Backup erstellen
cp api/data/app.db backup_$(date +%Y%m%d_%H%M%S).db

# Datenbank zurücksetzen (Vorsicht!)
rm api/data/app.db
# Beim nächsten API-Aufruf wird eine neue Datenbank erstellt
```

## Entwicklung

Für die lokale Entwicklung:
- Die Datenbank wird automatisch erstellt
- Testdaten können über die Admin-Oberfläche eingegeben werden
- Bei Problemen einfach `api/data/app.db` löschen und neu starten