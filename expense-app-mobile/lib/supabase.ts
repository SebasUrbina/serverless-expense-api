import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import { createClient } from "@supabase/supabase-js";

// Replace these with your Supabase details later 
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://xyzcompany.supabase.co";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "public-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		storage: AsyncStorage,
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
	},
});

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground
AppState.addEventListener("change", (state) => {
	if (state === "active") {
		supabase.auth.startAutoRefresh();
	} else {
		supabase.auth.stopAutoRefresh();
	}
});
