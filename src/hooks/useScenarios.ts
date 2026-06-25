import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { del, get, post, put } from "../api/client";
import type { Scenario } from "../engine/types";

export function useScenarios() {
	const [scenarios, setScenarios] = useState<Scenario[]>([]);
	const [error, setError] = useState<Error | null>(null);

	const refresh = useCallback(async () => {
		try {
			const data = await get<Scenario[]>("/api/scenarios");
			setScenarios(data);
			setError(null);
		} catch (err) {
			const e = err instanceof Error ? err : new Error(String(err));
			setError(e);
			toast.error(`Failed to load scenarios: ${e.message}`);
		}
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	async function addScenario(scenario: Scenario) {
		try {
			await post("/api/scenarios", scenario);
		} catch (err) {
			const e = err instanceof Error ? err : new Error(String(err));
			setError(e);
			toast.error(`Failed to add scenario: ${e.message}`);
			return;
		}
		await refresh();
	}

	async function updateScenario(scenario: Scenario) {
		try {
			await put(`/api/scenarios/${scenario.id}`, scenario);
		} catch (err) {
			const e = err instanceof Error ? err : new Error(String(err));
			setError(e);
			toast.error(`Failed to update scenario: ${e.message}`);
			return;
		}
		await refresh();
	}

	async function deleteScenario(id: string) {
		try {
			await del(`/api/scenarios/${id}`);
		} catch (err) {
			const e = err instanceof Error ? err : new Error(String(err));
			setError(e);
			toast.error(`Failed to delete scenario: ${e.message}`);
			return;
		}
		await refresh();
	}

	return { scenarios, error, addScenario, updateScenario, deleteScenario };
}
