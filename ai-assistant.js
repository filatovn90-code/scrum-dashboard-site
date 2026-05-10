(function () {
  const toggleButton = document.getElementById("aiAssistantToggle");
  const modal = document.getElementById("aiAssistantModal");
  const backdrop = document.getElementById("aiAssistantBackdrop");
  const closeButton = document.getElementById("aiAssistantClose");
  const form = document.getElementById("aiAssistantForm");
  const input = document.getElementById("aiAssistantInput");
  const messages = document.getElementById("aiAssistantMessages");
  const status = document.getElementById("aiAssistantStatus");
  const submitButton = document.getElementById("aiAssistantSubmit");

  if (!toggleButton || !modal || !form || !input || !messages || !status || !submitButton) {
    return;
  }

  function appendMessage(role, text) {
    const item = document.createElement("div");
    item.className = `ai-message ai-message-${role}`;
    item.textContent = text;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
  }

  function setBusy(isBusy) {
    submitButton.disabled = isBusy;
    input.disabled = isBusy;
    submitButton.textContent = isBusy ? "Думаю..." : "Отправить";
    status.textContent = isBusy ? "AI готовит ответ..." : "Можно задать вопрос по работе и задачам.";
  }

  function openModal() {
    modal.hidden = false;
    input.focus();
  }

  function closeModal() {
    modal.hidden = true;
  }

  async function sendMessage(event) {
    event.preventDefault();

    const message = input.value.trim();
    if (!message) {
      return;
    }

    appendMessage("user", message);
    input.value = "";
    setBusy(true);

    if (window.location.protocol === "file:") {
      appendMessage("assistant", "AI-чат заработает в опубликованной версии сайта на Vercel. При открытии файла напрямую API-маршруты недоступны.");
      status.textContent = "Для AI нужен опубликованный сайт или среда Vercel.";
      setBusy(false);
      return;
    }

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "AI temporarily unavailable.");
      }

      appendMessage("assistant", data.reply || "Ответ не получен.");
      status.textContent = `Ответ получен (${data.model || "AI"}).`;
    } catch (error) {
      appendMessage("assistant", "Сейчас не получилось получить ответ. Попробуйте ещё раз.");
      status.textContent = error.message || "AI temporarily unavailable.";
    } finally {
      setBusy(false);
    }
  }

  toggleButton.addEventListener("click", openModal);
  closeButton.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);
  form.addEventListener("submit", sendMessage);

  if (window.location.protocol === "file:") {
    status.textContent = "Локально кнопка видна, но AI ответит после публикации на Vercel.";
  }
})();
