import { useState } from "react";
import { Alert, StyleSheet, View, Text, TextInput, TouchableOpacity } from "react-native";
import { supabase } from "../lib/supabase";

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

	return (
		<View className="flex-1 justify-center px-6 bg-slate-900">
			<View className="items-center mb-10">
				<Text className="text-4xl font-extrabold text-white tracking-tight mb-2">
					Expense<Text className="text-emerald-400">Tracker</Text>
				</Text>
				<Text className="text-slate-400 text-base">Your personal finance dashboard</Text>
			</View>

			<View className="bg-slate-800 p-6 rounded-3xl shadow-xl shadow-black/50 border border-slate-700">
				<View className="mb-4">
					<Text className="text-slate-400 font-medium mb-2 ml-1 text-sm">Email</Text>
					<TextInput
						className="bg-slate-900 text-white rounded-2xl px-4 py-4 font-medium border border-slate-700 placeholder-slate-500"
						onChangeText={(text) => setEmail(text)}
						value={email}
						placeholder="email@address.com"
						placeholderTextColor="#64748b"
						autoCapitalize="none"
					/>
				</View>
				<View className="mb-8">
					<Text className="text-slate-400 font-medium mb-2 ml-1 text-sm">Password</Text>
					<TextInput
						className="bg-slate-900 text-white rounded-2xl px-4 py-4 font-medium border border-slate-700 placeholder-slate-500"
						onChangeText={(text) => setPassword(text)}
						value={password}
						secureTextEntry={true}
						placeholder="••••••••"
						placeholderTextColor="#64748b"
						autoCapitalize="none"
					/>
				</View>

				<View className="gap-y-3">
					<TouchableOpacity
						className="bg-emerald-500 rounded-2xl py-4 items-center flex-row justify-center active:bg-emerald-600 shadow-lg shadow-emerald-500/30"
						disabled={loading}
						onPress={() => signInWithEmail()}
					>
						<Text className="text-white font-bold text-lg">{loading ? "Loading..." : "Sign In"}</Text>
					</TouchableOpacity>

					<TouchableOpacity
						className="bg-transparent border-2 border-slate-700 rounded-2xl py-4 items-center flex-row justify-center active:bg-slate-700"
						disabled={loading}
						onPress={() => signUpWithEmail()}
					>
						<Text className="text-slate-300 font-bold text-lg">Create Account</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}
