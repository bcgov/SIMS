<template>
  <div class="p-component">
    <div class="p-m-2 p-grid">
      <div class="p-col-4">
        <div class="fa-app-header-1">New Application</div>
        <div class="fa-app-header-2">Welcome</div>
      </div>
    </div>
    <div class="p-m-4">
      <div class="p-grid">
        <Card class="p-col-8">
          <template #title>
            <div class="fa-app-header-3">
              Let’s get started on your application
            </div>
          </template>
          <template #content>
            <div class="p-grid">
              <div class="p-col-6">
                <div class="p-col-8">
                  In the next screens you’ll be able to select your application
                  type. Whether you are looking for a student loan, grants or
                  loan forgiveness options we’ve got you covered.
                </div>
                <div style="font-weight: bold" class="p-col-8">
                  Before you begin please gather the followings
                </div>
                <div class="p-col-8">
                  <ul>
                    <li>Your study information</li>
                    <li>Your dependent details and cost</li>
                    <li>Your income tax return documents</li>
                  </ul>
                </div>
              </div>
              <div class="p-col-6">
                <img
                  style="object-fit: contain"
                  alt="logo"
                  src="../assets/images/icon_assistance.svg"
                />
              </div>
            </div>
          </template>
          <template #footer>
            <Button
              label="Begin with your personal information"
              class="p-button-raised"
            />
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  setup() {
    return {};
  },
};
</script>

<style lang="scss" scoped>
.fa-app-header {
  font-family: Noto Sans;
  font-style: normal;
  font-weight: bold;
  font-size: 20px;
  line-height: 27px;
  flex: none;
  order: 0;
  flex-grow: 0;
  margin: 4px 0px;
}
.fa-app-header-1 {
  @extend .fa-app-header;
  color: #485363;
  opacity: 0.5;
}
.fa-app-header-2 {
  @extend .fa-app-header;
  top: 31px;
  letter-spacing: -0.2px;
  color: #485363;
}
.fa-app-header-3 {
  @extend .fa-app-header;
  color: #2965c5;
  line-height: 34px;
}
</style>