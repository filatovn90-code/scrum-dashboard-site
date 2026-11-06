export async function loadHostedSupabaseConfig(fetcher = fetch) {
  try {
    const response = await fetcher("/api/config/supabase");
    if (!response.ok) {
      throw new Error("Configuration endpoint failed");
    }

    const data = await response.json();
    if (!data?.ok || !data.url || !data.anonKey) {
      throw new Error("Configuration endpoint returned incomplete data");
    }

    return { url: data.url, anonKey: data.anonKey };
  } catch {
    throw new Error("Supabase configuration unavailable. Please try again later.");
  }
}
