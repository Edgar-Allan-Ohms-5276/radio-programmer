<template>
  <div id="menu-bar">
     <div class="left" role="menu">
       <img class="eao-menu-img" src="./static_img_eao_bird_circle.png" height="25px" />
     </div>
     <div class="right">
       <button class="menubar-btn" id="minimize-btn" v-on:click="minimize"><WindowMinimizeIcon title="Minimize Window" fillColor="#FFF" /></button>
       <button class="menubar-btn" id="max-unmax-btn" v-on:click="maxUnmax"><CropSquareIcon title="Maximize of Unmaximize Window" fillColor="#FFF" /></button>
       <button class="menubar-btn" id="close-btn" v-on:click="close"><CloseIcon title="Close Window" fillColor="#FFF" /></button>
     </div>
   </div>
</template>

<script scoped>
import menuActions from "./menu-functions";
import WindowMinimizeIcon from 'vue-material-design-icons/WindowMinimize.vue';
import CropSquareIcon from 'vue-material-design-icons/CropSquare.vue';  
import CloseIcon from 'vue-material-design-icons/Close.vue';

export default {
  name: 'Menu',
  components: {
    WindowMinimizeIcon,
    CropSquareIcon,
    CloseIcon
  },
  methods: {
    openMenu: function(event) {
      console.log(event)
      menuActions.openMenu(event.pageX, event.pageY)
    },
    minimize: function() {
      menuActions.minimizeWindow()
    },
    maxUnmax: function() {
      menuActions.maxUnmaxWindow()
    },
    close: function() {
      menuActions.closeWindow()
    },
  }
}
</script>

<style scoped>
#menu-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 30px;
  background: #000a12;
  -webkit-app-region: drag;
}

#menu-bar > div {
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.menubar-btn {
  -webkit-app-region: no-drag;
}

button {
  height: 100%;
  padding: 0 15px;
  border: none;
  background: transparent;
  outline: none;
}

button:hover {
  background: rgba(221, 221, 221, 0.2);
}

#close-btn:hover {
  background: rgb(255, 0, 0);
}

button i {
  color: white;
}

.eao-menu-img {
  margin-left: 5px;
}
</style>
