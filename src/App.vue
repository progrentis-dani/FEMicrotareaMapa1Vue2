<template>
  <div id="game-area">
    <!-- Menú de selección -->
    <div v-if="!varianteSeleccionada" class="menu-centro">
      <h2>Selecciona una variante</h2>
      <button @click="iniciarVariante(1)">Variante 1</button>
      <button @click="iniciarVariante(2)">Variante 2</button>
    </div>

    <!-- Solo se muestra el juego si selecciona la variante 1 -->
    <JuegoMapa1 v-if="varianteSeleccionada === 1" />
    <JuegoMapa2 v-if="varianteSeleccionada === 2" />
  </div>
</template>

<script>
import JuegoMapa1 from './components/JuegoMapa1.vue'
import JuegoMapa2 from './components/JuegoMapa2.vue'

export default {
  name: 'App',
  components: {
    JuegoMapa1,
    JuegoMapa2
  },
  data() {
    return {
      varianteSeleccionada: null
    }
  },
  methods: {
    iniciarVariante(variante) {
      this.varianteSeleccionada = variante
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.menu-centro {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #beb9b9;
  padding: 1.5rem 2rem;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0,0,0,0.2);
  text-align: center;
  font-family: 'Press Start 2P', cursive;
}

.menu-centro button {
  display: block;
  margin: 1rem auto;
  padding: 1rem 2rem;
  font-size: 0.8rem;
  background-color: #499749;
  border: 4px solid #005000;
  color: white;
  font-family: 'Press Start 2P', cursive;
  cursor: pointer;
  text-shadow: 1px 1px #000;
  transition: transform 0.1s, background-color 0.2s;
}
</style>
