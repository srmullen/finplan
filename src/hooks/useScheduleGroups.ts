import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { get, post } from "../api/client";
import type { ScheduleGroup, ScheduleGroupWithMembers } from "../engine/types";

export function useScheduleGroups() {
	const [scheduleGroups, setScheduleGroups] = useState<ScheduleGroup[]>([]);
	const [error, setError] = useState<Error | null>(null);

	const refresh = useCallback(async () => {
		try {
			const data = await get<ScheduleGroup[]>("/api/schedule-groups");
			setScheduleGroups(data);
			setError(null);
		} catch (err) {
			const e = err instanceof Error ? err : new Error(String(err));
			setError(e);
			toast.error(`Failed to load payment groups: ${e.message}`);
		}
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	async function addGroup(input: ScheduleGroupWithMembers) {
		try {
			await post("/api/schedule-groups", input);
		} catch (err) {
			const e = err instanceof Error ? err : new Error(String(err));
			setError(e);
			toast.error(`Failed to add payment group: ${e.message}`);
			return;
		}
		await refresh();
	}

	return { scheduleGroups, error, addGroup, refresh };
}
