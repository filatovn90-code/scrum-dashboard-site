(function () {
  const FALLBACK_ROOT_KEY = "__scrum_dashboard_store__";

  function readWindowStore() {
    try {
      const parsed = window.name ? JSON.parse(window.name) : {};
      const bucket = parsed[FALLBACK_ROOT_KEY];
      return bucket && typeof bucket === "object" ? bucket : {};
    } catch {
      return {};
    }
  }

  function writeWindowStore(bucket) {
    let parsed = {};

    try {
      parsed = window.name ? JSON.parse(window.name) : {};
    } catch {
      parsed = {};
    }

    parsed[FALLBACK_ROOT_KEY] = bucket;
    window.name = JSON.stringify(parsed);
  }

  function readLocal(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function writeLocal(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Ignore and rely on window.name fallback.
    }
  }

  function removeLocal(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore and rely on window.name fallback.
    }
  }

  window.appStorage = {
    getItem(key) {
      const localValue = readLocal(key);
      if (localValue !== null) {
        return localValue;
      }

      const bucket = readWindowStore();
      return Object.prototype.hasOwnProperty.call(bucket, key) ? bucket[key] : null;
    },

    setItem(key, value) {
      const serialized = String(value);
      writeLocal(key, serialized);

      const bucket = readWindowStore();
      bucket[key] = serialized;
      writeWindowStore(bucket);
    },

    removeItem(key) {
      removeLocal(key);

      const bucket = readWindowStore();
      delete bucket[key];
      writeWindowStore(bucket);
    }
  };
})();
