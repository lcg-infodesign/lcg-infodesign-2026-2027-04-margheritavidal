let data;
let maxUpperMortality = 0; // Valore massimo di mortalità nel dataset per fare le proporzioni
let hoveredRow = null; // Memorizza il numero di riga del glifo su cui passa il mouse

const continentColors = {
  "asia": "#D95F02",
  "europe": "#6b2e85",
  "africa": "#E7298A",
  "america": "#e1a1de",
  "default": "#666666"
};

const margin = 35; // Margine esterno intorno alla griglia
const minCellW = 230; // Larghezza minima di ogni cella della griglia
const cellH = 220; // Altezza fissa di ogni cella della griglia

async function setup() {
  data = await loadTable("famines.csv", ";", "header"); // Caricamento dataset

  for (let r = 0; r < data.getRowCount(); r++) { // Legge tutte le righe della tabella per trovare il massimo
    let upper = data.getNum(r, "Excess Mortality upper"); // Legge il valore numerico di mortalità massima della riga r
    if (upper > maxUpperMortality) maxUpperMortality = upper; // Aggiorna il massimo se trova un numero più grande
  }

  let cols = max(2, floor((windowWidth - margin * 2) / minCellW)); // Calcola quante colonne entrano nella larghezza dello schermo (minimo 2)
  let rows = ceil(data.getRowCount() / cols); // Calcola quante righe servono per contenere tutte le carestie
  let canvas = createCanvas(windowWidth, rows * cellH + margin * 2); // Crea il canvas alto quanto basta per contenere tutte le righe
  canvas.parent("canvas-container"); // Inserisce il canvas dentro il div HTML con id="canvas-container"
}

function draw() {
  background("#F4F3EF");
  hoveredRow = null; // Azzera la selezione hover a ogni fotogramma

  let cols = max(2, floor((width - margin * 2) / minCellW)); // Ricalcola il numero di colonne in base alla larghezza attuale
  let cellW = (width - margin * 2) / cols; // Calcola la larghezza esatta di ogni singola cella

  for (let r = 0; r < data.getRowCount(); r++) { // Cicla su tutte le righe del dataset per disegnare ogni glifo
    let colIndex = r % cols; // Trova la colonna (da 0 a cols-1) in cui posizionare il glifo
    let rowIndex = floor(r / cols); // Trova la riga in cui posizionare il glifo

    let cx = margin + colIndex * cellW + cellW / 2; // Calcola la coordinata X del centro del glifo nella sua cella
    let cy = margin + rowIndex * cellH + 80; // Calcola la coordinata Y del centro del glifo nella sua cella

    let country = data.getString(r, "Country"); // Prende il nome del Paese
    let year = data.getString(r, "Year"); // Prende l'anno dell'evento
    let continent = data.getString(r, "continent").trim().toLowerCase(); // Pulisce gli spazi e mette il continente in minuscolo
    let duration = data.getNum(r, "duration"); // Prende la durata in anni come numero
    let midpoint = data.getNum(r, "Excess Mortality midpoint"); // Prende la stima centrale dei decessi
    let upper = data.getNum(r, "Excess Mortality upper"); // Prende la stima massima dei decessi

    let lowerRaw = data.getString(r, "Excess Mortality lower").trim(); // Legge la stima minima come testo
    let lower = (lowerRaw === "-" || lowerRaw === "") ? midpoint : float(lowerRaw); // Se esiste la converte in numero, altrimenti usa midpoint

    let isHovered = dist(mouseX, mouseY, cx, cy) < 75; // Controlla se il mouse è vicino al centro del glifo
    if (isHovered) { // Se il mouse è sopra questo glifo
      hoveredRow = r; // Salva il numero di questa riga come elemento attivo
    }

    drawFamineGlyph(cx, cy, 62, lower, midpoint, upper, duration, continent); // Disegna il glifo nella posizione (cx, cy)

    noStroke();
    fill(isHovered ? "#000000" : "#444444"); // Testo nero se il mouse è sopra, grigio scuro altrimenti
    textAlign(CENTER, TOP); // Allinea il testo al centro orizzontalmente e in alto verticalmente
    textStyle(isHovered ? BOLD : NORMAL); // Mette il testo in grassetto solo quando il mouse è sopra il glifo
    textSize(11);
    text(`${country}\n(${year})`, cx - cellW / 2 + 8, cy + 68, cellW - 16, 65); // Scrive Paese e anno centrati sotto il glifo andando a capo se serve
  }

  cursor(hoveredRow !== null ? HAND : ARROW); // Cambia il cursore in manina se il mouse è su un glifo
}

function drawFamineGlyph(x, y, maxRadius, lower, midpoint, upper, duration, continent) { // Funzione che costruisce il glifo
  push(); // Salva le impostazioni grafiche attuali
  translate(x, y); // Sposta l'origine (0,0) al centro del glifo

  let hex = continentColors[continent] || continentColors["default"]; // Ottiene il colore del continente
  let col = color(hex); // Converte il codice del colore in un oggetto colore

  let rUpper = map(sqrt(upper), 0, sqrt(maxUpperMortality), 6, maxRadius); // Calcola il raggio della stima massima usando la radice quadrata per proporzionare le aree
  let rMid = map(sqrt(midpoint), 0, sqrt(maxUpperMortality), 5, maxRadius); // Calcola il raggio della stima centrale
  let rLower = map(sqrt(lower), 0, sqrt(maxUpperMortality), 4, maxRadius); // Calcola il raggio della stima minima

  noFill();
  stroke(col); // Colore uguale al continente
  strokeWeight(1.4); // Spessore della linea
  drawingContext.setLineDash([3, 3]); // Tratteggio
  circle(0, 0, rUpper * 2); // Cerchio tratteggiato della stima massima (diametro = raggio * 2)
  drawingContext.setLineDash([]); // Disattiva il tratteggio per le forme successive

  let fillCol = color(hex); // Copia del colore del continente
  fillCol.setAlpha(175); // Colore leggermente semitrasparente
  fill(fillCol); // Mette il colore di riempimento
  noStroke(); // Toglie il bordo al cerchio pieno
  circle(0, 0, rMid * 2); // Disegna il cerchio pieno della stima centrale

  if (lower < midpoint) { // Disegna l'anello interno solo se la stima minima è minore di quella centrale
    noFill(); // Toglie il riempimento interno
    stroke("#FFFFFF"); // Imposta il bordo bianco
    strokeWeight(1); // Imposta lo spessore del bordo bianco
    circle(0, 0, rLower * 2); // Disegna l'anello bianco della stima minima
  }

  stroke("#1E1E1E"); // Imposta il colore per i raggi della durata
  strokeWeight(1.3); // Imposta lo spessore dei raggi
  for (let i = 0; i < duration; i++) { // Ripete il ciclo tante volte quanti sono gli anni di durata
    let angle = map(i, 0, duration, -HALF_PI, TWO_PI - HALF_PI); // Calcola l'angolo di ogni raggio partendo da mezzogiorno (-HALF_PI)
    let outerR = max(rUpper + 6, 16); // Fa sporgere i raggi oltre il cerchio massimo
    line(0, 0, cos(angle) * outerR, sin(angle) * outerR); // Disegna il raggio dal centro fino al punto calcolato con coseno e seno
  }

  fill("#1E1E1E"); // Imposta il riempimento
  noStroke(); // Toglie il bordo
  circle(0, 0, 4.5); // Pallino centrale di ancoraggio dei raggi

  pop();
}

function mousePressed() { // Funzione eseguita quando si clicca con il mouse
  if (hoveredRow !== null) { // Se il clic avviene sopra un glifo
    window.location.href = `detail.html?row=${hoveredRow}`; // Apre la pagina di dettaglio passando il numero di riga nell'URL
  }
}

function windowResized() { // Funzione eseguita quando si ridimensiona la finestra del browser
  let cols = max(2, floor((windowWidth - margin * 2) / minCellW)); // Ricalcola le colonne per la nuova larghezza
  let rows = ceil(data.getRowCount() / cols); // Ricalcola le righe necessarie
  resizeCanvas(windowWidth, rows * cellH + margin * 2); // Aggiorna le dimensioni del canvas
}