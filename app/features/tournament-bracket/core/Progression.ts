// todo

import type { Tables, TournamentStageSettings } from "~/db/tables";
import { dateToDatabaseTimestamp } from "~/utils/dates";
import invariant from "../../../utils/invariant";

export interface DBSource {
	/** Index of the bracket where the teams come from */
	bracketIdx: number;
	/** Team placements that join this bracket. E.g. [1, 2] would mean top 1 & 2 teams. [-1] would mean the last placing teams. */
	placements: number[];
}

export interface EditableSource {
	/** Bracket ID that exists in frontend only while editing. Once the sources are set an index is used to identifyer them instead. See DBSource.bracketIdx for more info. */
	bracketId: string;
	/** User editable string of placements. For example might be "1-3" or "1,2,3" which both mean same thing. See DBSource.placements for the validated and serialized version. */
	placements: string;
}

interface BracketBase {
	type: Tables["TournamentStage"]["type"];
	settings: TournamentStageSettings;
	name: string;
	requiresCheckIn: boolean;
}

// Note sources is array for future proofing reasons. Currently the array is always of length 1 if it exists.

export interface InputBracket extends BracketBase {
	id: string;
	sources?: EditableSource[];
	startTime?: Date;
}

export interface ParsedBracket extends BracketBase {
	sources?: DBSource[];
	startTime?: number;
}

export type ValidationError =
	// user written placements can not be parsed
	| {
			type: "PLACEMENTS_PARSE_ERROR";
			bracketId: string;
	  }
	// tournament is ending with a format that does not resolve a winner such as round robin or grouped swiss
	| {
			type: "NOT_RESOLVING_WINNER";
	  }
	// from each bracket one placement can lead to only one bracket
	| {
			type: "SAME_PLACEMENT_TO_TWO_BRACKETS";
			bracketIds: string[];
	  }
	// from one bracket e.g. if 1st goes somewhere and 3rd goes somewhere then 2nd must also go somewhere
	| {
			type: "GAP_IN_PLACEMENTS";
			bracketId: string;
	  }
	// if round robin groups size is 4 then it doesn't make sense to have destination for 5
	| {
			type: "TOO_MANY_PLACEMENTS";
			bracketId: string;
	  }
	// two brackets can not have the same name
	| {
			type: "DUPLICATE_BRACKET_NAME";
			bracketIds: string[];
	  }
	// all brackets must have a name that is not an empty string
	| {
			type: "NAME_MISSING";
	  }
	// bracket cannot be both source and destination at the same time
	| {
			type: "CIRCULAR_PROGRESSION";
	  }
	// negative progression (e.g. losers of first round go somewhere) is only for elimination bracket
	| {
			type: "NEGATIVE_PROGRESSION";
	  };

/** Takes bracket progression as entered by user as input and returns the validated brackets ready for input to the database or errors if any. */
export function validatedBrackets(
	brackets: InputBracket[],
): ParsedBracket[] | ValidationError {
	let parsed: ParsedBracket[];
	try {
		parsed = toOutputBracketFormat(brackets);
	} catch (e) {
		if ((e as { badBracketId: string }).badBracketId) {
			return {
				type: "PLACEMENTS_PARSE_ERROR",
				bracketId: (e as { badBracketId: string }).badBracketId,
			};
		}

		throw e;
	}

	const validationError = bracketsToValidationError(parsed);

	if (validationError) {
		return validationError;
	}

	return parsed;
}

/** Checks parsed brackets for any errors related to how the progression is laid out  */
export function bracketsToValidationError(
	brackets: ParsedBracket[],
): ValidationError | null {
	if (!resolvesWinner(brackets)) {
		return {
			type: "NOT_RESOLVING_WINNER",
		};
	}

	return null;
}

function toOutputBracketFormat(brackets: InputBracket[]): ParsedBracket[] {
	const result = brackets.map((bracket) => {
		return {
			type: bracket.type,
			settings: bracket.settings,
			name: bracket.name,
			requiresCheckIn: bracket.requiresCheckIn,
			startTime: bracket.startTime
				? dateToDatabaseTimestamp(bracket.startTime)
				: undefined,
			sources: bracket.sources?.map((source) => {
				const placements = parsePlacements(source.placements);
				if (!placements) {
					throw { badBracketId: bracket.id };
				}

				return {
					bracketIdx: brackets.findIndex((b) => b.id === source.bracketId),
					placements,
				};
			}),
		};
	});

	invariant(
		result.every(
			(bracket) =>
				!bracket.sources ||
				bracket.sources.every((source) => source.bracketIdx >= 0),
			"Bracket source not found",
		),
	);

	return result;
}

function parsePlacements(placements: string) {
	const parts = placements.split(",");

	const result: number[] = [];

	for (let part of parts) {
		part = part.trim();
		const isValid = part.match(/^\d+(-\d+)?$/);
		if (!isValid) return null;

		if (part.includes("-")) {
			const [start, end] = part.split("-").map(Number);

			for (let i = start; i <= end; i++) {
				result.push(i);
			}
		} else {
			result.push(Number(part));
		}
	}

	return result;
}

function resolvesWinner(_brackets: ParsedBracket[]) {
	return true;
}

// // xxx: tests & export?
// function resolveFinals() {}

/** Takes the return type of `Progression.validatedBrackets` as an input and narrows the type to a successful validation */
export function isBrackets(
	input: ParsedBracket[] | ValidationError,
): input is ParsedBracket[] {
	return Array.isArray(input);
}

/** Given bracketIdx and bracketProgression will resolve if this the "final stage" of the tournament that decides the final standings  */
export function isFinals(idx: number, brackets: ParsedBracket[]) {
	invariant(idx < brackets.length, "Bracket index out of bounds");

	return resolveMainBracketProgression(brackets).at(-1) === idx;
}

/** Given bracketIdx and bracketProgression will resolve if this an "underground bracket".
 * Underground bracket is defined as a bracket that is not part of the main tournament progression e.g. optional bracket for early losers
 */
export function isUnderground(idx: number, brackets: ParsedBracket[]) {
	invariant(idx < brackets.length, "Bracket index out of bounds");

	return !resolveMainBracketProgression(brackets).includes(idx);
}

function resolveMainBracketProgression(brackets: ParsedBracket[]) {
	if (brackets.length === 1) return [0];

	let bracketIdxToFind = 0;
	const result = [0];
	while (true) {
		const bracket = brackets.findIndex((bracket) =>
			bracket.sources?.some(
				(source) =>
					source.placements.includes(1) &&
					source.bracketIdx === bracketIdxToFind,
			),
		);

		if (bracket === -1) break;

		bracketIdxToFind = bracket;
		result.push(bracketIdxToFind);
	}

	return result;
}
