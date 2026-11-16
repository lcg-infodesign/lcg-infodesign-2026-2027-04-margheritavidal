let data;
let selectedRow = null; 
let maxUpperMortality = 0; // Valore massimo di mortalità nel dataset per fare le proporzioni

const continentColors = { 
  "asia": "#D95F02", 
  "europe": "#6b2e85", 
  "africa": "#E7298A", 
  "america": "#e1a1de"
};

const continentLabels = { // Traduzione in IT
  "asia": "Asia", 
  "europe": "Europa", 
  "africa": "Africa", 
  "america": "America" 
};

async function setup() { 
  data = await loadTable("famines.csv", ";", "header"); // Caricamento dataset 

  for (let r = 0; r < data.getRowCount(); r++) { // legge tutte le righe della tabella per trovare il massimo
    let upper = data.getNum(r, "Excess Mortality upper"); // Legge il valore numerico di mortalità massima della riga r
    if (upper > maxUpperMortality) maxUpperMortality = upper; // Aggiorna il massimo se trova un numero più grande
  }

  let params = getURLParams(); // Legge i parametri scritti nell'indirizzo URL della pagina (es. ?row=5)
  if (params.row !== undefined) { // Controlla se nell'URL è presente il parametro "row"
    selectedRow = data.getRow(int(params.row)); // Prende direttamente la riga corrispondente a quel numero
  }

  let canvas = createCanvas(420, 420); 
  canvas.parent("glyph-container"); 
  noLoop(); 

  if (selectedRow) { // Controlla che la riga sia stata effettivamente trovata
    populateHTML(selectedRow); // Riempie i testi HTML con i dati della riga selezionata
  }
}

function populateHTML(row) { // Funzione che scrive i dati della carestia dentro i tag HTML
  let country = row.getString("Country"); // Prende il nome del Paese
  let startDate = row.getString("start_date"); // Prende la data di inizio
  let endDate = row.getString("end_date"); // Prende la data di fine
  let continent = row.getString("continent").trim().toLowerCase(); // Pulisce gli spazi e mette il continente in minuscolo
  let duration = row.getNum("duration"); // Prende la durata in anni come numero
  let midpoint = row.getNum("Excess Mortality midpoint"); // Prende la stima centrale dei decessi
  let upper = row.getNum("Excess Mortality upper"); // Prende la stima massima dei decessi

  let lowerRaw = row.getString("Excess Mortality lower").trim(); // Legge la stima minima come testo
  let hasLower = (lowerRaw !== "-" && lowerRaw !== ""); // Verifica se il dato minimo esiste davvero (diverso da "-" e non vuoto)
  let lower = hasLower ? float(lowerRaw) : midpoint; // Se esiste lo converte in numero, altrimenti usa midpoint come riserva

  let hex = continentColors[continent] || continentColors["default"]; // Recupera il colore corrispondente al continente
  let contName = continentLabels[continent] || continent; // Recupera il nome italiano del continente

  document.getElementById("country-title").textContent = country; // Inserisce il nome del Paese nel titolo HTML
  document.getElementById("meta-continent").textContent = contName; // Inserisce il continente nel sottotitolo HTML
  document.getElementById("meta-period").textContent = `${startDate} → ${endDate}`; // Inserisce il periodo nel sottotitolo HTML
  document.getElementById("detail-meta").style.color = hex; // Colora il sottotitolo con il colore del continente

  document.getElementById("icon-mid").style.backgroundColor = hex; // Colora l'icona piena nella legenda
  document.getElementById("icon-upper").style.borderColor = hex; // Colora il bordo tratteggiato nella legenda
  document.getElementById("icon-lower").style.backgroundColor = hex; // Colora l'icona della stima minima nella legenda

  document.getElementById("val-midpoint").textContent = `${formatNumber(midpoint)} decessi stimati`; // Scrive il valore di mortalità centrale
  document.getElementById("val-upper").textContent = `${formatNumber(upper)} decessi`; // Scrive il valore di stima massima
  document.getElementById("val-lower").textContent = hasLower ? `${formatNumber(lower)} decessi` : "Non disponibile (-)"; // Scrive la stima minima o "Non disponibile"
  document.getElementById("val-duration").textContent = `${duration} ${duration === 1 ? "anno" : "anni"}`; // Scrive la durata al singolare o al plurale
}

function draw() { 
  background("#F4F3EF"); 
  if (!selectedRow) return; 

  let continent = selectedRow.getString("continent").trim().toLowerCase(); // Prende il continente in minuscolo
  let duration = selectedRow.getNum("duration"); // Prende la durata in anni
  let midpoint = selectedRow.getNum("Excess Mortality midpoint"); // Prende la stima centrale
  let upper = selectedRow.getNum("Excess Mortality upper"); // Prende la stima massima

  let lowerRaw = selectedRow.getString("Excess Mortality lower").trim(); // Legge la stima minima come testo
  let hasLower = (lowerRaw !== "-" && lowerRaw !== ""); // Verifica se il dato minimo è disponibile
  let lower = hasLower ? float(lowerRaw) : midpoint; // Converte in numero o usa midpoint

  drawDetailedGlyph(width / 2, height / 2, 185, lower, hasLower, midpoint, upper, duration, continent); // Disegna il glifo al centro del canvas
}

function drawDetailedGlyph(x, y, maxRadius, lower, hasLower, midpoint, upper, duration, continent) { // Funzione che costruisce il glifo
  push(); // Salva le impostazioni grafiche attuali
  translate(x, y); // Sposta l'origine (0,0) al centro del canvas

  let hex = continentColors[continent] || continentColors["default"]; // Ottiene il colore del continente
  let col = color(hex); // Converte il codice del colore in un bollino di colore 

  let rUpper = map(sqrt(upper), 0, sqrt(maxUpperMortality), 14, maxRadius); // Calcola il raggio della stima massima usando la radice quadrata per proporzionare le aree
  let rMid = map(sqrt(midpoint), 0, sqrt(maxUpperMortality), 10, maxRadius); // Calcola il raggio della stima centrale
  let rLower = map(sqrt(lower), 0, sqrt(maxUpperMortality), 8, maxRadius); // Calcola il raggio della stima minima

  noFill(); 
  stroke(col); // colore uguale al continente
  strokeWeight(2); // spessore della linea
  drawingContext.setLineDash([6, 6]); // Tratteggio
  circle(0, 0, rUpper * 2); // Cerchio tratteggiato della stima massima (diametro = raggio * 2)
  drawingContext.setLineDash([]); // Disattiva il tratteggio per le forme successive

  let fillCol = color(hex); // Copia del colore del continente
  fillCol.setAlpha(170); // Colore leggermente semitrasparente 
  fill(fillCol); // Mette il colore di riempimento
  noStroke(); // Toglie il bordo al cerchio pieno
  circle(0, 0, rMid * 2); // Disegna il cerchio pieno della stima centrale

  if (hasLower && lower < midpoint) { // Disegna l'anello interno solo se la stima minima esiste ed è minore di quella centrale
    noFill(); // Toglie il riempimento interno
    stroke("#FFFFFF"); // Imposta il bordo bianco
    strokeWeight(1.8); // Imposta lo spessore del bordo bianco
    circle(0, 0, rLower * 2); // Disegna l'anello bianco della stima minima
  }

  stroke("#1E1E1E"); // Imposta il colore per i raggi della durata
  strokeWeight(2); // Imposta lo spessore dei raggi 
  for (let i = 0; i < duration; i++) { // Ripete il ciclo tante volte quanti sono gli anni di durata
    let angle = map(i, 0, duration, -HALF_PI, TWO_PI - HALF_PI); // Calcola l'angolo di ogni raggio partendo da mezzogiorno (-HALF_PI)
    let outerR = max(rUpper + 16, 42); // Fa sporgere i raggi oltre il cerchio massimo 
    line(0, 0, cos(angle) * outerR, sin(angle) * outerR); // Disegna il raggio dal centro fino al punto calcolato con coseno e seno
  }

  fill("#1E1E1E"); // Imposta il riempimento 
  noStroke(); // Toglie il bordo
  circle(0, 0, 8); // Pallino centrale di ancoraggio dei raggi

  pop(); 
}

function formatNumber(num) { // Funzione che formatta i numeri grandi con i punti delle migliaia
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); // Inserisce un punto ogni tre cifre partendo da destra
}