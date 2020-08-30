<template>
  <PickProgrammerType v-if="page == 'programmer_type'" />
</template>

<script>
import PickProgrammerType from "./PickProgrammerType.vue";

export default {
  name: 'EntryPoint',
  components: {
    PickProgrammerType
  },
  data: function() {
    return {
      page: "programmer_type"
    }
  }
}
</script>
