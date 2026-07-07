import { getSupabase } from "./supabase-client.js";
import { redirectIfAuthenticated } from "./auth-helpers.js";
import { appPath } from "./route-paths.js";

const form = document.getElementById("forgotPasswordForm");
const emailInput = document.getElementById("forgotPasswordEmail");
const submitButton = document.getElementById("forgotPasswordSubmit");
const statusBox = document.getElementById("forgotPasswordStatus");

redirectIfAuthenticated({ redirectTo: appPath() }).catch(() => null);

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  setStatus("Отправляю письмо...");

  try {
    const supabase = await getSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(emailInput.value.trim());
    if (error) {
      throw error;
    }

    setStatus("Письмо отправлено. Проверьте почту.");
  } catch (error) {
    setStatus(error.message || "Не удалось отправить письмо.", true);
  } finally {
    submitButton.disabled = false;
  }
});

function setStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.classList.toggle("is-error", isError);
}
