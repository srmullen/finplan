import { useCallback, useEffect, useState } from "react";
import { del, get, post, put } from "../api/client";
import type { Schedule } from "../engine/types";

export function useSchedules() {
	const [schedules, setSchedules] = useState<Schedule[]>([]);

	const refresh = useCallback(async () => {
		const data = await get<Schedule[]>("/api/schedules");
		setSchedules(data);
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	async function addSchedule(schedule: Schedule) {
		await post("/api/schedules", schedule);
		await refresh();
	}

	async function updateSchedule(schedule: Schedule) {
		await put(`/api/schedules/${schedule.id}`, schedule);
		await refresh();
	}

	async function deleteSchedule(id: string) {
		await del(`/api/schedules/${id}`);
		await refresh();
	}

	return { schedules, addSchedule, updateSchedule, deleteSchedule };
}
