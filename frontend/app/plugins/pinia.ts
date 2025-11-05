export default defineNuxtPlugin(nuxtApp => {
  const pinia = nuxtApp.$pinia;

  if (import.meta.server) {
    nuxtApp.hook('app:rendered', () => {
      // Prevent serialization errors by cleaning up stores on error
      if (nuxtApp.ssrContext?.error) {
        pinia.state.value = {};
      }
    });
  }
});
