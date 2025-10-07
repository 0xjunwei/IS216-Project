import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { auth } from "../js/config.js";
import { onAuthStateChanged } from "firebase/auth";

export function checkAuthentication() {
  const router = useRouter();
  let unsubscribe = null;

  onMounted(() => {
    unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace({ name: "Login" });
      }
    });
  });

  onUnmounted(() => {
    if (unsubscribe) unsubscribe();
  });
}
