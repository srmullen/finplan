export type AccountType =
	| "checking"
	| "savings"
	| "investment"
	| "credit_card"
	| "loan"
	| "other";

export type Owner = string;

export type Frequency =
	| "once"
	| "weekly"
	| "biweekly"
	| "semi-monthly"
	| "monthly"
	| "quarterly"
	| "annually";

export interface Account {
	id: string;
	name: string;
	type: AccountType;
	owner: Owner;
	institution?: string;
	seedBalance: number;
	seedDate: string; // ISO date YYYY-MM-DD
	rate: number; // annual percentage, e.g. 0.08 = 8%, negative for charges
	amortizing: boolean;
}

export interface ExternalParty {
	id: string;
	name: string;
}

export type NodeId = string; // Account.id or ExternalParty.id

export interface Schedule {
	id: string;
	sourceId: NodeId;
	destinationId: NodeId;
	amount: number;
	estimated: boolean;
	frequency: Frequency;
	startDate: string; // ISO date YYYY-MM-DD
	endDate?: string; // ISO date YYYY-MM-DD
	terminateAtZero: boolean; // only meaningful when destination is an amortizing Account
}

export interface Adjustment {
	id: string;
	accountId: string;
	date: string; // ISO date YYYY-MM-DD
	actualBalance: number;
}

// Scenario overrides — a Scenario is a diff over the Baseline

export interface ScheduleOverride {
	scheduleId: string;
	paused?: boolean;
	amount?: number;
	endDate?: string;
	terminateAtZero?: boolean;
}

export interface Scenario {
	id: string;
	name: string;
	scheduleOverrides: ScheduleOverride[];
	additionalSchedules: Schedule[];
	additionalAccounts: Account[];
}

// Projection engine I/O

export interface ProjectionInput {
	accounts: Account[];
	externalParties: ExternalParty[];
	schedules: Schedule[];
	adjustments: Adjustment[];
	scenario?: Scenario;
	startDate: string; // ISO date YYYY-MM-DD
	endDate: string; // ISO date YYYY-MM-DD
}

export interface BalancePoint {
	date: string; // ISO date YYYY-MM-DD
	balance: number;
}

export type ProjectionResult = Record<string, BalancePoint[]>; // accountId → time series
