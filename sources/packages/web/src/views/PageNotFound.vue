<template>
  <div class="notfound-page">
    <div class="error-card">
      <div class="left">
        <h2 class="title">Error 404</h2>
        <p class="heading">We couldn't find the webpage</p>
        <br />
        <p class="description">
          Try refreshing the page or check the webpage URL for typos.
        </p>
      </div>
      <div class="right" aria-hidden="false">
        <img :src="illustration" alt="An illustration of a 404 error." />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import illustration from "../assets/images/404.svg";
</script>

<style scoped>
.notfound-page {
  min-height: 72vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--v-theme-background, #f6f8fb);
}
.error-card {
  width: 100%;
  max-width: 1100px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(2, 6, 23, 0.08);
  display: flex;
  gap: 28px;
  overflow: hidden;
}
.left,
.right {
  padding: 40px 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.left {
  flex: 1 1 420px;
}
.right {
  flex: 1 1 420px;
  align-items: center;
}
.title {
  margin: 0 0 8px 0;
  color: #0b5ed7;
  font-size: 1.6rem;
  font-weight: 600;
}
.heading {
  margin: 0 0 12px 0;
  color: #0f1724;
  font-size: 1.125rem;
  font-weight: 600;
}
.description {
  margin: 0 0 20px 0;
  color: #475569;
}
.back-btn {
  display: inline-block;
  background: #1f6feb;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
.back-btn:focus {
  outline: 3px solid rgba(31, 111, 235, 0.25);
}
.right img {
  max-width: 360px;
  width: 100%;
  height: auto;
  display: block;
}

/* Responsive: stack vertically on small screens similar to attachment mobile example */
@media (max-width: 899px) {
  .error-card {
    flex-direction: column;
    text-align: center;
  }
  .left,
  .right {
    padding: 28px;
  }
  .right img {
    max-width: 260px;
    margin: 0 auto 8px auto;
  }
}
</style>
