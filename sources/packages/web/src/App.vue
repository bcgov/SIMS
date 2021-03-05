<template>
  <div>
    <Toast />
    <router-view :key="$route.fullPath" />
  </div>
</template>
