<template>
  <Card class="p-m-4">
    <template #title>
      Parsed Token
    </template>
    <template #content>
      <div v-if="user" class="p-fluid p-formgrid p-grid">
        <div
          v-for="(value, name) in user"
          :key="name"
          class="p-field p-sm-6 p-col-12"
        >
          <label>{{ name }}</label>
          <InputText :value="value" readonly />
        </div>
      </div>
    </template>
  </Card>
</template>

<script lang="ts">
import { KeycloakProfile, KeycloakTokenParsed } from "keycloak-js";
import { State, Action, Getter } from "vuex-class";
import { Options, Vue, setup } from "vue-class-component";
import AuthService from "../services/AuthService";
import { mapGetters } from "vuex";
import { AuthState } from "../store/states";

@Options({
  components: {},
})
export default class User extends Vue {
  @State((state) => state.auth)
  user!: AuthState;

  login() {
    AuthService.login({ idpHint: "bcsc" });
  }

  created() {
    console.log(this.user);
  }
}
</script>
