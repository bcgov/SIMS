<template>
  <div class="forbidden-page">
    <div class="error-card">
      <div class="left">
        <h2 class="title">Access denied</h2>
        <p class="heading">You don't have permission to view this page.</p>
        <p class="description">
          If you think this is an error, try returning to the home page or
          contact support.
        </p>
      </div>
      <div class="right" aria-hidden="true">
        <img
          :src="illustration"
          alt="An illustration of an astronaut lost in space."
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import illustration from "../assets/images/lost-in-space.svg";
</script>

<style scoped>
.forbidden-page {
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
  font-size: 1.4rem;
  font-weight: 600;
}
.heading {
  margin: 0 0 12px 0;
  color: #0f1724;
  font-size: 1.05rem;
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
  align-self: start;
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

@media (max-width: 899px) {
  .error-card {
    flex-direction: column;
    text-align: center;
  }
  .left,
  .right {
    padding: 28px;
  }
  .back-btn {
    align-self: center;
  }
  .right img {
    max-width: 260px;
    margin: 0 auto 8px auto;
  }
}
</style>
