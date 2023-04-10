<script>
import init from './index';

export default {
  mounted() {
    ymaps.ready(init);
  }
};
</script>

<template>
  <div id="map" style="width: 100vw; height: 100vh"></div>
</template>

<style></style>
