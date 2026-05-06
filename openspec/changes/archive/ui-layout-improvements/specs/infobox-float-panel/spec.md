## ADDED Requirements

### Requirement: Infobox als schwebendes Panel

Die Infobox MUSS als schwebendes Panel (`float: right`) innerhalb der Artikel-Content-Area dargestellt werden, anstatt als `q-drawer`.

#### Scenario: Infobox wird als Float-Panel angezeigt

- **WHEN** der User die Infobox einblendet
- **THEN** erscheint sie als Panel am rechten Rand des Artikel-Contents und der Text umfliesst sie

### Requirement: Infobox-FAB zum Einblenden

Ein Floating-Action-Button mit Info-Icon MUSS die Infobox einblenden, wenn sie ausgeblendet ist. Der FAB ist nur sichtbar, wenn ein Artikel mit Infobox geladen ist.

#### Scenario: User blendet Infobox ein

- **WHEN** der User auf den Info-FAB klickt
- **THEN** wird das Infobox-Float-Panel sichtbar

#### Scenario: FAB nur bei vorhandener Infobox

- **WHEN** ein Artikel keine Infobox hat
- **THEN** wird kein Info-FAB angezeigt

### Requirement: X-Button zum Ausblenden der Infobox

Das Infobox-Panel MUSS einen X-Button oben rechts haben, mit dem der User es ausblenden kann.

#### Scenario: User blendet Infobox aus

- **WHEN** der User auf den X-Button des Infobox-Panels klickt
- **THEN** wird das Panel ausgeblendet und der Artikel-Content nutzt die volle Breite

### Requirement: Rechter Drawer wird entfernt

Der `q-drawer` auf der rechten Seite (`side="right"`) im MainLayout MUSS entfernt werden. Die Infobox wird nicht mehr als Drawer dargestellt.

#### Scenario: Kein rechter Drawer im Layout

- **WHEN** der User die Anwendung nutzt
- **THEN** gibt es keinen rechten Drawer im Layout

### Requirement: Content-Umfluss bei schmalem Viewport

Bei sehr schmalen Viewports MUSS das Infobox-Panel über die volle Breite dargestellt werden (gestapelt), statt den Content unverhältnismässig zu verdrängen.

#### Scenario: Infobox auf schmalem Viewport

- **WHEN** der Viewport schmaler als 600px ist und die Infobox sichtbar ist
- **THEN** wird das Panel auf volle Breite gesetzt und der Content darunter dargestellt
