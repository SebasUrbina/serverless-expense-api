import { useState } from "react";
import { Alert, View, Text, TextInput, TouchableOpacity } from "react-native";
import { supabase } from "../lib/supabase";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import FontAwesome from "@expo/vector-icons/FontAwesome";

// Required for web browser flow
WebBrowser.maybeCompleteAuthSession();

export default function Auth() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	async function signInWithEmail() {
		setLoading(true);
		const { error } = await supabase.auth.signInWithPassword({
			email: email,
			password: password,
		});

		if (error) Alert.alert("Error Logging In", error.message);
		setLoading(false);
	}

	async function signUpWithEmail() {
		setLoading(true);
		const { data, error } = await supabase.auth.signUp({
			email: email,
			password: password,
		});

		if (error) {
			Alert.alert("Error Signing Up", error.message);
		} else if (!data.session) {
			Alert.alert("Check your inbox", "Please verify your email.");
		}
		setLoading(false);
	}

	const createSessionFromUrl = async (url: string) => {
		const { params, errorCode } = QueryParams.getQueryParams(url);

		if (errorCode) throw new Error(errorCode);
		const { access_token, refresh_token } = params;

		if (!access_token) return;

		const { error } = await supabase.auth.setSession({
			access_token,
			refresh_token: refresh_token || "",
		});
		if (error) throw error;
	};

	async function signInWithGoogle() {
		setLoading(true);
		try {
			const redirectUrl = Linking.createURL("/(tabs)/", { scheme: "seva" });
			const { data, error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: redirectUrl,
					skipBrowserRedirect: true,
				},
			});

			if (error) throw error;

			if (data?.url) {
				const res = await WebBrowser.openAuthSessionAsync(
					data.url,
					redirectUrl
				);

				if (res.type === "success") {
					const { url } = res;
					await createSessionFromUrl(url);
				}
			}
		} catch (err: any) {
			Alert.alert("Google Login Error", err.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<View className="flex-1 justify-center px-8 bg-black">
			<View className="items-center mb-12">
				<Text className="text-5xl font-extrabold text-white tracking-tighter mb-1">
					Se<Text className="text-[#30D158]">va</Text>
				</Text>
				<Text className="text-gray-400 text-sm font-medium tracking-wide">¿En que seva mi plata?</Text>
			</View>

			<View className="w-full">
				<View className="mb-5">
					<Text className="text-gray-400 font-semibold mb-2 ml-1 text-xs uppercase tracking-wider">Email</Text>
					<TextInput
						className="bg-[#1C1C1E] text-white rounded-xl px-5 py-4 font-medium border border-[#2C2C2E] placeholder-gray-500 text-base"
						onChangeText={(text) => setEmail(text)}
						value={email}
						placeholder="ejemplo@correo.com"
						placeholderTextColor="#64748b"
						autoCapitalize="none"
					/>
				</View>
				<View className="mb-8">
					<Text className="text-gray-400 font-semibold mb-2 ml-1 text-xs uppercase tracking-wider">Password</Text>
					<TextInput
						className="bg-[#1C1C1E] text-white rounded-xl px-5 py-4 font-medium border border-[#2C2C2E] placeholder-gray-500 text-base"
						onChangeText={(text) => setPassword(text)}
						value={password}
						secureTextEntry={true}
						placeholder="••••••••"
						placeholderTextColor="#64748b"
						autoCapitalize="none"
					/>
				</View>

				<View className="gap-y-4">
					<TouchableOpacity
						className="bg-[#30D158] rounded-xl py-4 items-center flex-row justify-center active:bg-[#28b34b]"
						disabled={loading}
						onPress={() => signInWithEmail()}
					>
						<Text className="text-black font-semibold text-lg">{loading ? "Cargando..." : "Sign In"}</Text>
					</TouchableOpacity>

					<TouchableOpacity
						className="bg-transparent rounded-xl py-4 items-center flex-row justify-center active:bg-[#1C1C1E]"
						disabled={loading}
						onPress={() => signUpWithEmail()}
					>
						<Text className="text-gray-300 font-semibold text-base">Crear Cuenta Nueva</Text>
					</TouchableOpacity>

					<View className="flex-row items-center my-4">
						<View className="flex-1 h-[1px] bg-[#2C2C2E]" />
						<Text className="text-gray-500 font-medium px-4 text-xs tracking-wider">O CONTINUAR CON</Text>
						<View className="flex-1 h-[1px] bg-[#2C2C2E]" />
					</View>

					<TouchableOpacity
						className="bg-white rounded-xl py-4 items-center flex-row justify-center active:opacity-80"
						disabled={loading}
						onPress={() => signInWithGoogle()}
					>
						<FontAwesome name="google" size={18} color="#000" style={{ marginRight: 10 }} />
						<Text className="text-black font-semibold text-base">Google</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}
