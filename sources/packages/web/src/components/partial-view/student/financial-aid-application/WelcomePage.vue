<template>
  <div v class="p-component">
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
                <ul class="p-col-8">
                  <li>Your study information</li>
                  <li>Your dependent details and cost</li>
                  <li>Your income tax return documents</li>
                </ul>
              </div>
              <div class="img-background p-col-6"></div>
            </div>
          </template>
          <template #footer>
            <Button
              label="Begin with your personal information"
              class="p-button-raised"
              @click="handleClick"
            />
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { SetupContext } from "vue";
import { useRouter } from "vue-router";
export default {
  setup(props: any, context: SetupContext) {
    console.log("Inside Welcome page");
    const router = useRouter();
    const handleClick = () => {
      context.emit("user-ready");
      router.push({ name: "personal-info" });
    };
    return {
      handleClick,
    };
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

.img-background {
  background-image: url("../../../../assets/images/icon_assistance.svg");
}
</style>
