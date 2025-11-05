<script setup lang="ts"></script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    <main>
      <slot />
    </main>
    <NotificationToast />
  </div>
</template>
