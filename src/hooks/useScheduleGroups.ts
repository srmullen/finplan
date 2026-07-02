import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { get } from "../api/client";
import type { ScheduleGroup } from "../engine/types";

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

	return { scheduleGroups, error };
}
