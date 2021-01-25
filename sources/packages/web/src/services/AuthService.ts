import Keycloak from "keycloak-js"
import store from "../store/index"

const keycloak = Keycloak({
  url: "https://dev.oidc.gov.bc.ca/auth/",
  realm: "jxoe2o46",
  clientId: "student"
});

keycloak.init({ onLoad: "check-sso", responseMode: "query", checkLoginIframe: false })
    .then(() => {
        if(keycloak.authenticated){
            store.dispatch("auth/login", keycloak);
            store.dispatch("student/setStudentProfileData",keycloak);
            console.dir(keycloak)
        }
        else {
            store.dispatch("auth/logout");
        }

        if(keycloak && keycloak.idTokenParsed){
            if(keycloak.idTokenParsed.iat){
                const iatMiliseconds = keycloak.idTokenParsed.iat * 1000;
                console.log("Issue Date (iat): " + new Date(iatMiliseconds));
            }

            if(keycloak.idTokenParsed.exp){
                const expMiliseconds = keycloak.idTokenParsed.exp * 1000;
                console.log("Expiration (exp): " + new Date(expMiliseconds));
            }
        }
    })
    .catch(() => {
        console.log("init -> catch");
    });

keycloak.onTokenExpired = () => {
    console.log("onTokenExpired");
};

export default keycloak;