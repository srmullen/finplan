import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { del, get, post, put } from "../api/client";
import type { Schedule } from "../engine/types";

export function useSchedules() {
	const [schedules, setSchedules] = useState<Schedule[]>([]);
	const [error, setError] = useState<Error | null>(null);

	const refresh = useCallback(async () => {
		try {
			const data = await get<Schedule[]>("/api/schedules");
			setSchedules(data);
			setError(null);
		} catch (err) {
			const e = err instanceof Error ? err : new Error(String(err));
			setError(e);
			toast.error(`Failed to load schedules: ${e.message}`);
		}
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	async function addSchedule(schedule: Schedule) {
		try {
			await post("/api/schedules", schedule);
		} catch (err) {
			const e = err instanceof Error ? err : new Error(String(err));
			setError(e);
			toast.error(`Failed to add schedule: ${e.message}`);
			return;
		}
		await refresh();
	}

	async function updateSchedule(schedule: Schedule) {
		try {
			await put(`/api/schedules/${schedule.id}`, schedule);
		} catch (err) {
			const e = err instanceof Error ? err : new Error(String(err));
			setError(e);
			toast.error(`Failed to update schedule: ${e.message}`);
			return;
		}
		await refresh();
	}

	async function deleteSchedule(id: string) {
		try {
			await del(`/api/schedules/${id}`);
		} catch (err) {
			const e = err instanceof Error ? err : new Error(String(err));
			setError(e);
			toast.error(`Failed to delete schedule: ${e.message}`);
			return;
		}
		await refresh();
	}

	return {
		schedules,
		error,
		addSchedule,
		updateSchedule,
		deleteSchedule,
		refresh,
	};
}
