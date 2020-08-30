<template>
  <div>
    <h1>Pick Programmer Type:</h1>
    <button v-on:click="changePage('standard')">Standard</button>
  </div>
</template>

<script>
export default {
  name: 'PickProgrammerType',
  methods: {
    changePage: function(page) {
      this.$parent.page = page
    }
  }
}
</script>

<style lang="scss" scoped>
h1 {
  font-size: 50px;
}

button {
    background-color: #d32f2f;
    cursor: pointer;
    text-decoration: none;
    padding: 1rem;
    border: 0;
    transition: all 0.5s;
    border-radius: 10px;
    width: auto;
    position: relative;
    white-space: nowrap;
    margin: 0.5% 1%;
    font-size: 25px;

    &:hover {
        border-radius: 10px;
        box-shadow: 0px 6px 15px black;
    }
}

</style>