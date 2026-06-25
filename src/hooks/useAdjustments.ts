import { useCallback, useEffect, useState } from "react";
import { del, get, post } from "../api/client";
import type { Adjustment } from "../engine/types";

export function useAdjustments() {
	const [adjustments, setAdjustments] = useState<Adjustment[]>([]);

	const refresh = useCallback(async () => {
		const data = await get<Adjustment[]>("/api/adjustments");
		setAdjustments(data);
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	async function addAdjustment(adjustment: Adjustment) {
		await post("/api/adjustments", adjustment);
		await refresh();
	}

	async function deleteAdjustment(id: string) {
		await del(`/api/adjustments/${id}`);
		await refresh();
	}

	return { adjustments, addAdjustment, deleteAdjustment };
}
