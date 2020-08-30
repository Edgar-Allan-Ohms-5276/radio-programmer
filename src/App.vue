<template>
  <div>
    <Menu />
    <div id="app">
      <EntryPoint />
      <p>Created by the <a href="https://edgarallanohms.com" target="_blank"><img style="vertical-align:middle; display:inline;" class="eao-menu-img" src="./components/menu/static_img_eao_bird_circle.png" height="20px" /> Edgar Allan Ohms</a></p>
    </div>
  </div>
</template>

<script>
import Menu from './components/menu/Menu.vue'
import EntryPoint from './components/EntryPoint.vue'

export default {
  name: 'App',
  components: {
    EntryPoint,
    Menu
  }
}
</script>

<style>
body {
  padding: 0;
  margin: 0;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  background-color: #263238;
  color: white;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: white;
  margin: 0;
  position: absolute;
  top: 40%;
  left: 50%;
  -ms-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  width: 100%;
}

a {
    color: #ff6659;
}
</style>
