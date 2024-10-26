export const TOURNAMENT = {
	TEAM_NAME_MAX_LENGTH: 32,
	COUNTERPICK_MAPS_PER_MODE: 2,
	COUNTERPICK_MAX_STAGE_REPEAT: 2,
	COUNTERPICK_ONE_MODE_TOURNAMENT_MAPS_PER_MODE: 6,
	AVAILABLE_BEST_OF: [1, 3, 5, 7] as const,
	ENOUGH_TEAMS_TO_START: 2,
	MIN_GROUP_SIZE: 3,
	MAX_GROUP_SIZE: 6,
	MAX_BRACKETS_PER_TOURNAMENT: 10,
	BRACKET_NAME_MAX_LENGTH: 32,
	// just a fallback, normally this should be set by user explicitly
	DEFAULT_TEAM_COUNT_PER_RR_GROUP: 4,
} as const;
