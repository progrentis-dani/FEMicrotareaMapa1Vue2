<template>
  <div class="container">
    <div class="main-content">
      <div class="game-area" ref="gameAreaRef">
        <div class="world" :style="mundoStyle">

          <!-- calles -->
          <div v-for="(calle, i) in calles" :key="'calle-' + i" class="calle" :style="{ top: calle.y + 'px', left: calle.x + 'px' }" />

          <!-- camino real -->
          <div v-for="(tile, i) in mapa" :key="i" class="tile" :style="{ top: tile.y + 'px', left: tile.x + 'px' }" />

          <!-- jugador y objetivo -->
          <img class="player" src="@/assets/player.png" :style="{top: player.y + playerOffset + 'px',left: player.x + playerOffset + 'px',transform: 'rotate(' + rotationAngle + 'deg)'}" />
          <div class="goal" :style="{ top: goal.y + 'px', left: goal.x + 'px' }" />
        </div>

        <!-- instrucciones -->
        <div class="instruction-bar">
          <span class="arcade-text" v-if="!finalizado">{{ instrucciones[paso]?.texto || '-' }}</span>
          <span class="arcade-text" v-else>{{ mensajeFinal }}</span>
        </div>
      </div>

      <div class="info" v-if="!mostrarMenu">
        <h3 class="arcade-text">Info</h3>
        <p class="arcade-text">⏳ {{ formatoTiempo(tiempoRestante) }}</p>
        <p class="arcade-text">👣 {{ paso }}</p>
        <p class="arcade-text">❤️ {{ 3 - errores }}</p>

        <div class="info-controls" v-if="esperandoRespuesta && !finalizado">
          <button class="btn" @click="responder('Izquierda')">◀</button>
          <button class="btn" @click="responder('Derecha')">▶</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  data() {
    return {
      tileSize: 40,
      ancho: 0,
      alto: 0,
      calles: [],
      mapa: [],
      instrucciones: [],
      paso: 0,
      errores: 0,
      esperandoRespuesta: false,
      finalizado: false,
      mensajeFinal: '',
      tiempoRestante: 0,
      player: { x: 0, y: 0, dir: 'right' },
      goal: { x: 0, y: 0 },
      playerSize: 30,
      mostrarMenu: false,
      temporizador: null
    };
  },
  computed: {
    mundoStyle() {
      const offsetX = 400 - this.player.x;
      const offsetY = 300 - this.player.y;
      return {
        position: 'absolute',
        top: '0',
        left: '0',
        transform: `translate(${offsetX}px, ${offsetY}px)`,
        transition: 'transform 0.4s ease'
      };
    },
    rotationAngle() {
      switch (this.player.dir) {
        case 'right': return 0;
        case 'down': return 90;
        case 'left': return 180;
        case 'up': return 270;
        default: return 0;
      }
    },
    playerOffset() {
      return (this.tileSize - this.playerSize) / 2;
    }
  },
  mounted() {
    this.tiempoRestante = 120;
    this.ajustarDimensionesAlGameArea();
    const crudo = this.generarCamino(this.ancho, this.alto);
    this.calles = this.generarCalles(crudo, this.ancho, this.alto);
    this.mapa = crudo.map(([x, y]) => ({ x: x * this.tileSize, y: y * this.tileSize }));
    const cruces = this.detectarCruces(this.mapa);
    this.instrucciones = this.generarInstrucciones(this.mapa, cruces);
    this.player.x = this.mapa[0].x;
    this.player.y = this.mapa[0].y;
    this.goal.x = this.mapa[this.mapa.length - 1].x;
    this.goal.y = this.mapa[this.mapa.length - 1].y;
    this.avanzarAlSiguienteCruce();
  },
  methods: {
    ajustarDimensionesAlGameArea() {
      const gameArea = this.$el.querySelector('.game-area');
      const width = gameArea.offsetWidth;
      const height = gameArea.offsetHeight;
      this.ancho = Math.floor(width / this.tileSize);
      this.alto = Math.floor(height / this.tileSize);
    },
    generarCamino(ancho, alto) {
    const camino = []
    const visitado = new Set()
    let x = 0
    let y = Math.floor(alto / 2)

    camino.push([x, y])
    visitado.add(`${x},${y}`)

    x++
    camino.push([x, y])
    visitado.add(`${x},${y}`)

    let cruces = 0
    let pasosDesdeUltimoCruce = 0
    const minSeparacionEntreCruces = 4 // Aumentar la separacion minima entre los cruces
    const largoCruce = 2  // cuantas casillas deben seguirse después de un giro

    const maxCruces = 1  // cuantos cruces principales

    while (x < ancho - 1) {
        const opciones = []

        // inicie siempre hacia la derecha
        if (x + 1 < ancho && !visitado.has(`${x + 1},${y}`)) {
        opciones.push('derecha')
        }

        // Solo permitir cruces despues de que haya suficiente espacio
        if (cruces < maxCruces && pasosDesdeUltimoCruce >= minSeparacionEntreCruces) {
        if (y > 0 && !visitado.has(`${x},${y - 1}`)) opciones.push('arriba')
        if (y < alto - 1 && !visitado.has(`${x},${y + 1}`)) opciones.push('abajo')
        }

        if (cruces >= maxCruces) {
        opciones.length = 0  
        opciones.push('derecha')
        }

        if (opciones.length === 0) break

        const direccion = opciones[Math.floor(Math.random() * opciones.length)]

        if (direccion === 'derecha') {
        x++
        pasosDesdeUltimoCruce++
        } else if (direccion === 'arriba') {
        y--
        cruces++
        pasosDesdeUltimoCruce = 0
        } else if (direccion === 'abajo') {
        y++
        cruces++
        pasosDesdeUltimoCruce = 0
        }

        const key = `${x},${y}`
        if (!visitado.has(key)) {
        camino.push([x, y])
        visitado.add(key)
        }

        if (cruces > 0) {
        let pasosDeCruce = largoCruce  

        while (pasosDeCruce > 0) {
            if (direccion === 'derecha') x++
            if (direccion === 'arriba') y--
            if (direccion === 'abajo') y++

            const key = `${x},${y}`
            if (!visitado.has(key)) {
            camino.push([x, y])
            visitado.add(key)
            }

            pasosDeCruce--
        }

        cruces = 0
        }
    }

    // Continuar camino 
    while (x < ancho - 1) {
        x++
        const key = `${x},${y}`
        if (!visitado.has(key)) {
        camino.push([x, y])
        visitado.add(key)
        }
    }

    return camino
    },
    generarCalles(camino, ancho, alto) {
    const tiles = new Set(camino.map(([x, y]) => `${x},${y}`))
    const callesFalsas = new Set()
    const caminoXY = new Set(camino.map(([x, y]) => `${x},${y}`))

    const maxCalles = 25
    const maxIntentos = 5000
    let intentos = 0
    const fuentes = [...camino]

    const direccionesBase = [
        [1, 0], [-1, 0], [0, 1], [0, -1]
    ]

    while (callesFalsas.size < maxCalles && intentos < maxIntentos) {
        intentos++

        const [cx, cy] = fuentes[Math.floor(Math.random() * fuentes.length)]
        let [dx, dy] = direccionesBase[Math.floor(Math.random() * 4)]

        let nx = cx + dx
        let ny = cy + dy
        const key = `${nx},${ny}`

        const dentro = nx >= 0 && ny >= 0 && nx < ancho && ny < alto
        const noEsCamino = !tiles.has(key)
        const noRepetido = !callesFalsas.has(key)

        if (!dentro || !noEsCamino || !noRepetido) continue

        // Evitar paralelo al camino
        const paraleloKey1 = `${nx + dy},${ny + dx}`
        const paraleloKey2 = `${nx - dy},${ny - dx}`
        const esParalelo = caminoXY.has(paraleloKey1) || caminoXY.has(paraleloKey2)
        if (esParalelo) continue

        // Evitar calles dobles
        const vecinos = [
        `${nx + 1},${ny}`, `${nx - 1},${ny}`,
        `${nx},${ny + 1}`, `${nx},${ny - 1}`
        ]
        if (vecinos.filter(v => callesFalsas.has(v)).length > 1) continue

        let longitud = Math.floor(Math.random() * 2) + 2 // 2-3 pasos
        let paso = 0
        let curvaHecha = false

        while (paso < longitud) {
        const nuevoKey = `${nx},${ny}`
        const dentro2 = nx >= 0 && ny >= 0 && nx < ancho && ny < alto
        const noTile = !tiles.has(nuevoKey)
        const noRepetido2 = !callesFalsas.has(nuevoKey)

        const adyacentes = [
            `${nx + 1},${ny}`, `${nx - 1},${ny}`,
            `${nx},${ny + 1}`, `${nx},${ny - 1}`
        ]
        const falsasCerca = adyacentes.filter(v => callesFalsas.has(v)).length

        if (dentro2 && noTile && noRepetido2 && falsasCerca < 2) {
            callesFalsas.add(nuevoKey)
            fuentes.push([nx, ny])
            nx += dx
            ny += dy
            paso++

            // 30% de probabilidad de cambiar de direccion 1 vez
            if (!curvaHecha && Math.random() < 0.3) {
            const opcionesCurva = direccionesBase
                .filter(([ddx, ddy]) => ddx !== -dx || ddy !== -dy) // no volver atras
            const [newDx, newDy] = opcionesCurva[Math.floor(Math.random() * opcionesCurva.length)]
            dx = newDx
            dy = newDy
            curvaHecha = true
            }
        } else {
            break
        }
        }
    }

    return Array.from(callesFalsas).map(str => {
        const [x, y] = str.split(',').map(Number)
        return { x: x * this.tileSize, y: y * this.tileSize }
    })
    },
    detectarCruces(mapa) {
    const cruces = []
    for (let i = 1; i < mapa.length - 1; i++) {
        const actual = mapa[i]
        const anterior = mapa[i - 1]
        const siguiente = mapa[i + 1]

        const dx1 = actual.x - anterior.x
        const dy1 = actual.y - anterior.y
        const dx2 = siguiente.x - actual.x
        const dy2 = siguiente.y - actual.y

        const direccionCambio = dx1 !== dx2 || dy1 !== dy2

        if (direccionCambio) {
        cruces.push({ ...actual, index: i })
        }
    }

    // Separar los cruces en reales y secundarios
    const resultado = []
    let ultimoIndex = -10
    let reales = 0

    for (const cruce of cruces) {
        const esPrincipal = reales < 2 && (cruce.index - ultimoIndex >= 3)
        resultado.push({ ...cruce, principal: esPrincipal })
        if (esPrincipal) {
        reales++
        ultimoIndex = cruce.index
        }
    }

    return resultado
    },
    avanzarAlSiguienteCruce() {
    if (this.paso >= this.instrucciones.length) {
      this.finalizado = true;
      this.mensajeFinal = this.errores < 3 ? '¡Bien hecho!' : '¡Fallaste!';
      return;
    }

    const siguiente = this.instrucciones[this.paso];
    const intervalo = setInterval(() => {
      if (this.player.x < siguiente.x) {
        this.player.x += this.tileSize;
        this.player.dir = 'right';
      } else if (this.player.x > siguiente.x) {
        this.player.x -= this.tileSize;
        this.player.dir = 'left';
      } else if (this.player.y < siguiente.y) {
        this.player.y += this.tileSize;
        this.player.dir = 'down';
      } else if (this.player.y > siguiente.y) {
        this.player.y -= this.tileSize;
        this.player.dir = 'up';
      } else {
        clearInterval(intervalo);
        this.esperandoRespuesta = true;
      }
    }, 300);
    },
    generarInstrucciones(mapa, cruces) {
    const instrucciones = []
    for (const cruce of cruces) {
        const i = cruce.index
        const anterior = mapa[i - 1]
        const actual = mapa[i]
        const siguiente = mapa[i + 1]

        const dx1 = actual.x - anterior.x
        const dy1 = actual.y - anterior.y
        const dx2 = siguiente.x - actual.x
        const dy2 = siguiente.y - actual.y

        const direccionAnterior = this.getDireccion(dx1, dy1);
        const direccionSiguiente = this.getDireccion(dx2, dy2);
        const instruccion = this.getInstruccion(direccionAnterior, direccionSiguiente);
        instrucciones.push({ x: actual.x, y: actual.y, texto: instruccion });
    }
    return instrucciones
    },
    getDireccion(dx, dy) {
      if (dx === this.tileSize) return 'right';
      if (dx === -this.tileSize) return 'left';
      if (dy === this.tileSize) return 'down';
      if (dy === -this.tileSize) return 'up';
    },
    getInstruccion(de, a) {
      if ((de === 'up' && a === 'left') || (de === 'left' && a === 'down') || (de === 'down' && a === 'right') || (de === 'right' && a === 'up')) {
        return 'Izquierda';
      }
      return 'Derecha';
    },
    responder(direccion) {
      const instruccion = this.instrucciones[this.paso];
      if (!instruccion) return;

      const correcta = instruccion.texto === direccion;
      if (correcta) {
        this.paso++;
        this.esperandoRespuesta = false;
        this.avanzarAlSiguienteCruce();
      } else {
        this.errores++;
        if (this.errores >= 3) {
          this.finalizado = true;
          this.mensajeFinal = '¡Fallaste!';
        }
      }
    },
    formatoTiempo(segundos) {
      const min = Math.floor(segundos / 60);
      const sec = segundos % 60;
      return `${min}:${sec < 10 ? '0' + sec : sec}`;
    }
  }
};
</script>

<style scoped>

@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.arcade-text {
font-family: 'Press Start 2P';
font-size: 15px;
color: rgb(255, 255, 255);
}

.menu-container {
position: fixed;
inset: 0;
background: #f5f5f5;
display: flex;
align-items: center;
justify-content: center;
z-index: 100;
}

.menu-box {
background: white;
padding: 2rem;
border-radius: 1rem;
box-shadow: 0 0 15px rgba(0,0,0,0.1);
text-align: center;
}

.menu-title {
font-size: 1.5rem;
margin-bottom: 1rem;
}

.menu-btn {
display: block;
width: 100%;
margin-top: 0.5rem;
padding: 0.75rem;
background: #007bff;
color: white;
font-weight: bold;
border: none;
border-radius: 0.5rem;
cursor: pointer;
transition: background 0.2s;
}

.menu-btn:hover {
background: #0056b3;
}

.container {
display: flex;
flex-direction: column;
align-items: center;
gap: 1rem;
}

.main-content {
display: flex;
flex-direction: row;
justify-content: center;
align-items: flex-start;
width: 100%;
max-width: 1100px; 
gap: 1rem;
}

.game-area {
width: 800px;
height: 600px;
position: relative;
border: 4px solid black;
background-color: rgb(16, 97, 16);
background-image: url("@/assets/moss.jpg");
overflow: hidden;
}

@keyframes vibracion {
0% { transform: translate(0px, 0px); }
50% { transform: translate(-2px, 1px); }
100% { transform: translate(2px, -1px); }
}

.vibracion-error {
animation: vibracion 0.2s ease;
border: 4px solid #ff0044 !important;
}

.gameover {
border: 4px solid #ff0044 !important;
}

.borde-verde {
border: 4px solid #00ff88 !important;
}

.borde-verde-final {
border: 4px solid #00ff88 !important;
}

.info {
width: 200px;
height: 608px; 
background-color: #4e4848;
padding: 1rem;
box-sizing: border-box;
}

.info-controls {
display: flex;
flex-direction: column;
gap: 0.5rem;
margin-top: 1rem;
}

.info-controls .btn {
width: 100%;
}

.calle {
width: 40px;
height: 40px;
box-sizing: border-box;
background-image: url("@/assets/calle.jpg");  
background-size: contain;
background-color: rgb(71, 69, 69);
position: absolute;
border:2px solid #000000;
z-index: 0;
margin: -1px;
}

.tile {
width: 40px;
height: 40px;
box-sizing: border-box;
background-image: url("@/assets/oak.jpg");  
background-size: cover;
background-color: gray;
position: absolute;
border:2px solid #000000;
z-index: 0;
margin: -1px;
}

.player {
width: 30px;
height: 30px;
position: absolute;
transition: top 0.4s, left 0.4s;  
z-index: 10;
}

.goal {
width: 40px;
height: 40px;
background-color: #00ff88;
box-shadow: 0 0 8px #00ff88;
position: absolute;
}

.instruction-bar {
position: absolute;
top: 0;
left: 0;
width: 100%;
height: 5%;
background-color: #000000;
color: white;
text-align: center;
padding: 1rem;
font-weight: bold;
z-index: 5;
}

.controls {
display: flex;
gap: 1rem;
justify-content: center;
}

.btn {
padding: 0.5rem 1rem;
background-color: #4e4848;
color: white;
border: none;
cursor: pointer;
border-radius: 3%;
font-size: 50px;
}

.btn:hover {
background-color: #3b3b3b8c;
}
</style>