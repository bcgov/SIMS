<template>
  <div class="maintenance-page">
    <div class="error-card">
      <div class="left">
        <h2 class="title">Service temporarily unavailable</h2>
        <p class="heading">We're performing maintenance.</p>
        <br />
        <p class="description">
          The Student Information Management System is currently unavailable for
          maintenance. Please try again later.
        </p>
        <p class="muted">
          We apologize for the inconvenience and appreciate your patience.
        </p>
      </div>
      <div class="right" aria-hidden="true">
        <img
          :src="illustration"
          alt="An illustration of two people holding an unplugged cord. Illustration by storyset."
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import illustration from "../assets/images/person-unplugged.svg";
</script>

<style scoped>
.maintenance-page {
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
  font-size: 1.5rem;
  font-weight: 600;
}
.heading {
  margin: 0 0 12px 0;
  color: #0f1724;
  font-size: 1.125rem;
  font-weight: 600;
}
.description {
  margin: 0 0 14px 0;
  color: #475569;
}
.muted {
  margin: 0;
  color: #6b7280;
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
  .right img {
    max-width: 260px;
    margin: 0 auto 8px auto;
  }
}
</style>
