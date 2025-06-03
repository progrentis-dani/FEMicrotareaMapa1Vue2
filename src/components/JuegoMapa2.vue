<template>
  <div class="container">
    <div class="main-content">
    <div
      class="game-area"
      :class="{
        'vibracion-error': borderState === 'error',
        'borde-verde': borderState === 'correcto'
      }"
      ref="gameAreaRef"
    >
        <div v-if="!juegoIniciado" class="blur-overlay"></div>
        <button
          v-if="!juegoIniciado"
          class="boton-iniciar"
          @click="iniciarJuego"
        >
          Iniciar
        </button>
        <div v-if="juegoIniciado" class="world" :style="mundoStyle">
          <!-- camino -->
          <div v-for="(tile, i) in mapa" :key="i" class="tile" :style="{ top: tile.y + 'px', left: tile.x + 'px' }" />

          <!-- jugador y objetivo -->
          <img class="player" src="@/assets/player.png" :style="{top: player.y + playerOffset + 'px',left: player.x + playerOffset + 'px',transform: 'rotate(' + rotationAngle + 'deg)'}" />
          <div class="goal1" :style="{ top: goalPrincipal.y + 'px', left: goalPrincipal.x + 'px' }" />
          <div class="goal2" :style="{ top: goalOpuesto.y + 'px', left: goalOpuesto.x + 'px' }" />
        </div>

        <!-- instrucciones -->
        <div v-if="juegoIniciado" class="instruction-bar">
          <span class="arcade-text" v-if="!finalizado">
            {{ paso === 0 ? 'Dir\u00edgete a ' + (objetivoElegido === 'goal1' ? 'el objetivo verde' : 'el objetivo morado') : (instrucciones[paso]?.texto || '-') }}
          </span>
          <span class="arcade-text" v-else>{{ mensajeFinal }}</span>
        </div>
      </div>

      <div class="info" v-if="juegoIniciado && !mostrarMenu">
        <h3 class="arcade-text">Info</h3>

        <p class="arcade-text">⏳ {{ formatoTiempo(tiempoRestante) }}</p>
        <p class="arcade-text">🦶 {{ paso }}</p>
        <p class="arcade-text">❤️ {{ 3 - errores }}</p>

        <div class="info-controls" v-if="esperandoRespuesta && !finalizado">
          <button class="btn" @click="responder('Izquierda')">◀</button>
          <button class="btn" @click="responder('Derecha')">▶</button>
        </div>
        <div v-if="finalizado" class="reinicio-container">
          <button class="btn" @click="reiniciar">🔄</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      juegoIniciado: false,
      indiceCaminoActual: 0,
      objetivoElegido: '',
      tileSize: 40,
      ancho: 0,
      alto: 0,
      mapa: [],
      instrucciones: [],
      player: { x: 0, y: 0, dir: 'right' },
      goalPrincipal: { x: 0, y: 0 },
      goalOpuesto: { x: 0, y: 0 },
      playerSize: 30,
      paso: 0,
      errores: 0,
      esperandoRespuesta: false,
      finalizado: false,
      mensajeFinal: '',
      tiempoRestante: 120,
      temporizador: null,
      modoEnfoque: false,
      enfoqueObjetivo: { x: 0, y: 0 },
      mostrarMenu: false,
      borderState: ''
    }
  },
  computed: {
    playerOffset() {
      return (this.tileSize - this.playerSize) / 2
    },
    rotationAngle() {
      switch (this.player.dir) {
        case 'right': return 0
        case 'down': return 90
        case 'left': return 180
        case 'up': return 270
        default: return 0
      }
    },
    mundoStyle() {
      const foco = this.modoEnfoque ? this.enfoqueObjetivo : this.player
      const offsetX = 400 - foco.x
      const offsetY = 300 - foco.y
      return {
        position: 'absolute',
        top: '0',
        left: '0',
        transform: `translate(${offsetX}px, ${offsetY}px)` ,
        transition: 'transform 0.8s ease'
      }
    }
  },
  methods: {
    iniciarJuego() {
      this.juegoIniciado = true
      this.inicializarJuego()

      const objetivo = this.objetivoElegido === 'goal1' ? this.goalPrincipal : this.goalOpuesto
      this.enfoqueObjetivo = { x: objetivo.x, y: objetivo.y }
      this.modoEnfoque = true

      setTimeout(() => {
        this.modoEnfoque = false
        this.iniciarMovimientoAutomatico()
      }, 2000)

      this.iniciarTemporizador()
    },
    ajustarDimensionesAlGameArea() {
      const gameArea = this.$refs.gameAreaRef
      const width = gameArea.offsetWidth
      const height = gameArea.offsetHeight
      this.ancho = Math.floor(width / this.tileSize)
      this.alto = Math.floor(height / this.tileSize)
    },
    generarCamino(ancho, alto, largoCruce = 4) {
      const camino = []
      const visitado = new Set()
      let x = 0
      let y = Math.floor(alto / 2)
      camino.push([x, y])
      visitado.add(`${x},${y}`)
      x++
      camino.push([x, y])
      visitado.add(`${x},${y}`)
      const minSeparacionEntreCruces = 4
      const maxCruces = 1
      let cruces = 0
      let pasosDesdeUltimoCruce = 0
      while (x < ancho - 1) {
        const opciones = []
        if (x + 1 < ancho && !visitado.has(`${x + 1},${y}`)) opciones.push('derecha')
        if (cruces < maxCruces && pasosDesdeUltimoCruce >= minSeparacionEntreCruces) {
          if (y > 0 && !visitado.has(`${x},${y - 1}`)) opciones.push('arriba')
          if (y < alto - 1 && !visitado.has(`${x},${y + 1}`)) opciones.push('abajo')
        }
        if (cruces >= maxCruces) opciones.splice(0, opciones.length, 'derecha')
        if (opciones.length === 0) break
        const direccion = opciones[Math.floor(Math.random() * opciones.length)]
        if (direccion === 'derecha') { x++; pasosDesdeUltimoCruce++ }
        else if (direccion === 'arriba') { y--; cruces++; pasosDesdeUltimoCruce = 0 }
        else if (direccion === 'abajo') { y++; cruces++; pasosDesdeUltimoCruce = 0 }
        const key = `${x},${y}`
        if (!visitado.has(key)) {
          camino.push([x, y])
          visitado.add(key)
        }
        if (cruces > 0 && (direccion === 'arriba' || direccion === 'abajo')) {
          let pasosVerticales = largoCruce - 1
          while (pasosVerticales > 0) {
            if (direccion === 'arriba' && y > 0) y--
            if (direccion === 'abajo' && y < alto - 1) y++
            const keyPaso = `${x},${y}`
            if (!visitado.has(keyPaso)) camino.push([x, y]), visitado.add(keyPaso)
            pasosVerticales--
          }
          let pasosDerecha = 2
          while (pasosDerecha > 0 && x + 1 < ancho) {
            x++
            const keyPaso = `${x},${y}`
            if (!visitado.has(keyPaso)) camino.push([x, y]), visitado.add(keyPaso)
            pasosDerecha--
          }
          cruces = 0
        }
      }
      const caminoOpuesto = camino.map(([x, y]) => [x, alto - 1 - y])
      const goal1 = camino[camino.length - 1]
      let goal2 = caminoOpuesto.slice().reverse().find(([x, y]) => {
        return (x !== goal1[0] || y !== goal1[1]) && y !== goal1[1]
      }) || caminoOpuesto[0]
      return {
        camino: [...camino.map(([x, y]) => ({ x, y, tipo: 'original' })), ...caminoOpuesto.map(([x, y]) => ({ x, y, tipo: 'reflejado' }))],
        goals: [goal1, goal2]
      }
    },
    detectarCruces(mapa) {
      const cruces = []
      for (let i = 1; i < mapa.length - 1; i++) {
        const actual = mapa[i], anterior = mapa[i - 1], siguiente = mapa[i + 1]
        const dx1 = actual.x - anterior.x, dy1 = actual.y - anterior.y
        const dx2 = siguiente.x - actual.x, dy2 = siguiente.y - actual.y
        if (dx1 !== dx2 || dy1 !== dy2) cruces.push({ ...actual, index: i })
      }
      const resultado = []
      let ultimoIndex = -10, reales = 0
      for (const cruce of cruces) {
        const esPrincipal = reales < 2 && (cruce.index - ultimoIndex >= 3)
        resultado.push({ ...cruce, principal: esPrincipal })
        if (esPrincipal) reales++, ultimoIndex = cruce.index
      }
      return resultado
    },
    getDireccion(dx, dy) {
      if (dx === this.tileSize) return 'right'
      if (dx === -this.tileSize) return 'left'
      if (dy === this.tileSize) return 'down'
      if (dy === -this.tileSize) return 'up'
    },
    getInstruccion(de, a) {
      if ((de === 'up' && a === 'left') || (de === 'left' && a === 'down') || (de === 'down' && a === 'right') || (de === 'right' && a === 'up')) return 'Izquierda'
      return 'Derecha'
    },
    generarInstrucciones(mapa, cruces) {
      const instrucciones = []
      for (const cruce of cruces) {
        const i = cruce.index, anterior = mapa[i - 1], actual = mapa[i], siguiente = mapa[i + 1]
        const dx1 = actual.x - anterior.x, dy1 = actual.y - anterior.y
        const dx2 = siguiente.x - actual.x, dy2 = siguiente.y - actual.y
        const dirAnt = this.getDireccion(dx1, dy1), dirSig = this.getDireccion(dx2, dy2)
        instrucciones.push({ x: actual.x, y: actual.y, texto: this.getInstruccion(dirAnt, dirSig) })
      }
      return instrucciones
    },
    inicializarJuego() {
      const crudo = this.generarCamino(this.ancho, this.alto, 4)
      this.mapa = crudo.camino.map(({ x, y, tipo }) => ({ x: x * this.tileSize, y: y * this.tileSize, tipo }))
      this.objetivoElegido = Math.random() < 0.5 ? 'goal1' : 'goal2'
      const [gx1, gy1] = crudo.goals[0], [gx2, gy2] = crudo.goals[1]
      this.goalPrincipal = { x: gx1 * this.tileSize, y: gy1 * this.tileSize }
      this.goalOpuesto = { x: gx2 * this.tileSize, y: gy2 * this.tileSize }
      const tipoBuscado = this.objetivoElegido === 'goal1' ? 'original' : 'reflejado'
      const caminoActivo = this.mapa.filter(tile => tile.tipo === tipoBuscado)
      this.player = { x: caminoActivo[0].x, y: caminoActivo[0].y, dir: 'right' }
      const nuevosCruces = this.detectarCruces(caminoActivo)
      this.instrucciones = this.generarInstrucciones(caminoActivo, nuevosCruces)
      this.indiceCaminoActual = 0
    },
    iniciarMovimientoAutomatico() {
    const tipoBuscado = this.objetivoElegido === 'goal1' ? 'original' : 'reflejado'
    const caminoActivo = this.mapa.filter(tile => tile.tipo === tipoBuscado)

    const mover = () => {
        if (this.indiceCaminoActual >= caminoActivo.length - 1 || this.finalizado) return

        const actual = caminoActivo[this.indiceCaminoActual]
        const siguiente = caminoActivo[this.indiceCaminoActual + 1]

        const dx = siguiente.x - actual.x
        const dy = siguiente.y - actual.y
        this.player.x = siguiente.x
        this.player.y = siguiente.y
        this.player.dir = this.getDireccion(dx, dy)

        // Verifica si llegó al objetivo
        const objetivo = this.objetivoElegido === 'goal1' ? this.goalPrincipal : this.goalOpuesto
        if (this.player.x === objetivo.x && this.player.y === objetivo.y) {
       this.finalizado = true;
        this.mensajeFinal = '¡Objetivo alcanzado!';
        this.borderState = 'correcto';

        setTimeout(() => {
          this.borderState = '';
        }, 500);
        return;
        }

        this.indiceCaminoActual++

        const cruce = this.instrucciones.find(inst => inst.x === this.player.x && inst.y === this.player.y)
        if (cruce && cruce.texto) {
        this.esperandoRespuesta = true
        return
        }

        setTimeout(mover, 270)
    }

    setTimeout(mover, 270)
    },
    
responder(direccionJugador) {
  const instruccionActual = this.instrucciones[this.paso]
  if (!instruccionActual) return

  if (direccionJugador === instruccionActual.texto) {
    this.borderState = 'correcto'

    setTimeout(() => {
      this.borderState = ''
      this.paso++
      this.esperandoRespuesta = false
      this.iniciarMovimientoAutomatico()
    }, 300) // el borde verde se muestra brevemente
  } else {
    this.borderState = 'error'

    setTimeout(() => {
      this.borderState = ''
      this.errores++
      if (this.errores >= 3) {
      this.finalizado = true;
      this.mensajeFinal = '¡Fallaste!';
      this.borderState = 'error';

      setTimeout(() => {
        this.borderState = '';
      }, 500);
      }
    }, 300) // el borde rojo y vibración se muestran brevemente
  }
},
reiniciar() {
  clearInterval(this.temporizador);

  this.indiceCaminoActual = 0;
  this.objetivoElegido = '';
  this.mapa = [];
  this.instrucciones = [];
  this.player = { x: 0, y: 0, dir: 'right' };
  this.goalPrincipal = { x: 0, y: 0 };
  this.goalOpuesto = { x: 0, y: 0 };
  this.paso = 0;
  this.errores = 0;
  this.esperandoRespuesta = false;
  this.finalizado = false;
  this.mensajeFinal = '';
  this.tiempoRestante = 120;

  this.inicializarJuego();
  const objetivo = this.objetivoElegido === 'goal1' ? this.goalPrincipal : this.goalOpuesto;
  this.enfoqueObjetivo = { x: objetivo.x, y: objetivo.y };
  this.modoEnfoque = true;

  setTimeout(() => {
    this.modoEnfoque = false;
    this.iniciarMovimientoAutomatico();
  }, 2000);

  this.iniciarTemporizador();
},

formatoTiempo(t) {
      const min = Math.floor(t / 60)
      const sec = t % 60
      return `${min}:${sec.toString().padStart(2, '0')}`
    },
  iniciarTemporizador() {
  this.temporizador = setInterval(() => {
    if (this.finalizado) return;

    if (this.tiempoRestante > 0) {
      this.tiempoRestante--;
    } else {
      this.finalizado = true;
      this.mensajeFinal = '¡Tiempo agotado!';
      this.borderState = 'error';
      clearInterval(this.temporizador);

      setTimeout(() => {
        this.borderState = '';
      }, 500);
    }
    }, 1000);
  },  
},

mounted() {
  this.ajustarDimensionesAlGameArea()
},

  beforeDestroy() {
    clearInterval(this.temporizador)
  }
}
</script>

<style>

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

.blur-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.2); /* opcional */
  z-index: 1;
}

.boton-iniciar {
  position: absolute;
  z-index: 2;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  padding: 1rem 2rem;
  font-size: 1.5rem;
  cursor: pointer;
  font-family: 'Press Start 2P';
  background-color: #499749;
  border: 4px solid #005000;
  color: white;
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

.goal1 {
width: 40px;
height: 40px;
background-color: #00ff88;
box-shadow: 0 0 8px #00ff88;
position: absolute;
}

.goal2 {
width: 40px;
height: 40px;
background-color: #6f00ff;
box-shadow: 0 0 8px #6f00ff;
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

.reinicio-container {
  text-align: center;
  margin-top: 20px;
}

.btn:hover {
background-color: #3b3b3b8c;
}
</style>