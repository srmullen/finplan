import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { del, get, post } from "../api/client";
import type { Adjustment } from "../engine/types";

export function useAdjustments() {
	const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
	const [error, setError] = useState<Error | null>(null);

	const refresh = useCallback(async () => {
		try {
			const data = await get<Adjustment[]>("/api/adjustments");
			setAdjustments(data);
			setError(null);
		} catch (err) {
			const e = err instanceof Error ? err : new Error(String(err));
			setError(e);
			toast.error(`Failed to load adjustments: ${e.message}`);
		}
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	async function addAdjustment(adjustment: Adjustment) {
		try {
			await post("/api/adjustments", adjustment);
		} catch (err) {
			const e = err instanceof Error ? err : new Error(String(err));
			setError(e);
			toast.error(`Failed to add adjustment: ${e.message}`);
			return;
		}
		await refresh();
	}

	async function deleteAdjustment(id: string) {
		try {
			await del(`/api/adjustments/${id}`);
		} catch (err) {
			const e = err instanceof Error ? err : new Error(String(err));
			setError(e);
			toast.error(`Failed to delete adjustment: ${e.message}`);
			return;
		}
		await refresh();
	}

	return { adjustments, error, addAdjustment, deleteAdjustment };
}
