import { Form, useLoaderData, useSearchParams } from "@remix-run/react";
import clone from "just-clone";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { AbilitiesSelector } from "~/components/AbilitiesSelector";
import { Button } from "~/components/Button";
import { FormMessage } from "~/components/FormMessage";
import { Image } from "~/components/Image";
import { Label } from "~/components/Label";
import { RequiredHiddenInput } from "~/components/RequiredHiddenInput";
import { SubmitButton } from "~/components/SubmitButton";
import { CrossIcon } from "~/components/icons/Cross";
import { PlusIcon } from "~/components/icons/Plus";
import { GearComboBox } from "~/components/ui/Combobox/GearComboBox";
import { WeaponComboBox } from "~/components/ui/Combobox/WeaponComboBox";
import { MyLabel } from "~/components/ui/MyLabel";
import { BUILD } from "~/constants";
import type { GearType } from "~/db/types";
import {
	validatedBuildFromSearchParams,
	validatedWeaponIdFromSearchParams,
} from "~/features/build-analyzer";
import { modesShort } from "~/modules/in-game-lists";
import { rankedModesShort } from "~/modules/in-game-lists/modes";
import type { BuildAbilitiesTupleWithUnknown } from "~/modules/in-game-lists/types";
import type { SendouRouteHandle } from "~/utils/remix";
import { modeImageUrl } from "~/utils/urls";

import { action } from "../actions/u.$identifier.builds.new.server";
import { loader } from "../loaders/u.$identifier.builds.new.server";
export { loader, action };

export const handle: SendouRouteHandle = {
	i18n: ["weapons", "builds", "gear"],
};

export default function NewBuildPage() {
	const { buildToEdit } = useLoaderData<typeof loader>();
	const { t } = useTranslation();
	const [searchParams] = useSearchParams();
	const [abilities, setAbilities] =
		React.useState<BuildAbilitiesTupleWithUnknown>(
			buildToEdit?.abilities ?? validatedBuildFromSearchParams(searchParams),
		);

	return (
		<div className="half-width u__build-form">
			<Form className="stack md items-start" method="post">
				{buildToEdit && (
					<input type="hidden" name="buildToEditId" value={buildToEdit.id} />
				)}
				<WeaponsSelector />
				<GearSelector
					type="HEAD"
					abilities={abilities}
					setAbilities={setAbilities}
				/>
				<GearSelector
					type="CLOTHES"
					abilities={abilities}
					setAbilities={setAbilities}
				/>
				<GearSelector
					type="SHOES"
					abilities={abilities}
					setAbilities={setAbilities}
				/>
				<FormMessage type="info">{t("builds:forms.noGear.info")}</FormMessage>
				<Abilities abilities={abilities} setAbilities={setAbilities} />
				<TitleInput />
				<DescriptionTextarea />
				<ModeCheckboxes />
				<PrivateCheckbox />
				<SubmitButton className="mt-4">{t("actions.submit")}</SubmitButton>
			</Form>
		</div>
	);
}

function TitleInput() {
	const { t } = useTranslation("builds");
	const { buildToEdit } = useLoaderData<typeof loader>();

	return (
		<div>
			<Label htmlFor="title" required>
				{t("forms.title")}
			</Label>
			<input
				id="title"
				name="title"
				required
				minLength={BUILD.TITLE_MIN_LENGTH}
				maxLength={BUILD.TITLE_MAX_LENGTH}
				defaultValue={buildToEdit?.title}
			/>
		</div>
	);
}

function DescriptionTextarea() {
	const { t } = useTranslation();
	const { buildToEdit } = useLoaderData<typeof loader>();
	const [value, setValue] = React.useState(buildToEdit?.description ?? "");

	return (
		<div>
			<Label
				htmlFor="description"
				valueLimits={{
					current: value.length,
					max: BUILD.DESCRIPTION_MAX_LENGTH,
				}}
			>
				{t("forms.description")}
			</Label>
			<textarea
				id="description"
				name="description"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				maxLength={BUILD.DESCRIPTION_MAX_LENGTH}
			/>
		</div>
	);
}

function ModeCheckboxes() {
	const { buildToEdit } = useLoaderData<typeof loader>();
	const { t } = useTranslation("builds");

	const modes = buildToEdit?.modes ?? rankedModesShort;

	return (
		<div>
			<Label>{t("forms.modes")}</Label>
			<div className="stack horizontal md">
				{modesShort.map((mode) => (
					<div key={mode} className="stack items-center">
						<MyLabel spaced htmlFor={mode}>
							<Image alt="" path={modeImageUrl(mode)} width={24} height={24} />
						</MyLabel>
						<input
							id={mode}
							name={mode}
							type="checkbox"
							defaultChecked={modes.includes(mode)}
							data-testid={`${mode}-checkbox`}
						/>
					</div>
				))}
			</div>
		</div>
	);
}

function PrivateCheckbox() {
	const { buildToEdit } = useLoaderData<typeof loader>();
	const { t } = useTranslation(["builds", "common"]);

	return (
		<div>
			<Label htmlFor="private">{t("common:build.private")}</Label>
			<input
				id="private"
				name="private"
				type="checkbox"
				defaultChecked={Boolean(buildToEdit?.private)}
			/>
			<FormMessage type="info" className="mt-0">
				{t("builds:forms.private.info")}
			</FormMessage>
		</div>
	);
}

function WeaponsSelector() {
	const [searchParams] = useSearchParams();
	const { buildToEdit } = useLoaderData<typeof loader>();
	const { t } = useTranslation(["common", "weapons", "builds"]);
	const [weapons, setWeapons] = React.useState(
		buildToEdit?.weapons.map((wpn) => wpn.weaponSplId) ?? [
			validatedWeaponIdFromSearchParams(searchParams),
		],
	);

	return (
		<div>
			<Label required htmlFor="weapon">
				{t("builds:forms.weapons")}
			</Label>
			<div className="stack sm">
				{weapons.map((weapon, i) => {
					return (
						<div key={i} className="stack horizontal sm items-center">
							<div>
								<WeaponComboBox
									name="weapon"
									isRequired={i === 0}
									onChange={(newWeaponId) =>
										typeof newWeaponId === "number" &&
										setWeapons((weapons) => {
											const newWeapons = [...weapons];
											newWeapons[i] = newWeaponId;
											return newWeapons;
										})
									}
									value={weapon ?? undefined}
									disabledWeaponIds={weapons
										.filter((w) => typeof w === "number")
										.filter((w) => w !== weapon)}
								/>
							</div>
							{i === weapons.length - 1 && (
								<>
									<Button
										size="tiny"
										disabled={weapons.length === BUILD.MAX_WEAPONS_COUNT}
										onClick={() => setWeapons((weapons) => [...weapons, null])}
										icon={<PlusIcon />}
										testId="add-weapon-button"
									/>
									{weapons.length > 1 && (
										<Button
											size="tiny"
											onClick={() =>
												setWeapons((weapons) => {
													const newWeapons = [...weapons];
													newWeapons.pop();
													return newWeapons;
												})
											}
											variant="destructive"
											icon={<CrossIcon />}
										/>
									)}
								</>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}

function GearSelector({
	type,
	abilities,
	setAbilities,
}: {
	type: GearType;
	abilities: BuildAbilitiesTupleWithUnknown;
	setAbilities: (abilities: BuildAbilitiesTupleWithUnknown) => void;
}) {
	const { buildToEdit, gearIdToAbilities } = useLoaderData<typeof loader>();
	const { t } = useTranslation("builds");
	const [value, setValue] = React.useState<number | null>(() => {
		const gearId = !buildToEdit
			? null
			: type === "HEAD"
				? buildToEdit.headGearSplId
				: type === "CLOTHES"
					? buildToEdit.clothesGearSplId
					: buildToEdit.shoesGearSplId;

		if (gearId === -1) return null;

		return gearId;
	});

	return (
		<div>
			<Label htmlFor={type}>{t(`forms.gear.${type}`)}</Label>
			<div>
				<GearComboBox
					slot={type}
					name={type}
					id={type}
					value={value}
					onChange={(gearId) => {
						setValue(gearId);

						if (typeof gearId !== "number") return;

						const abilitiesFromExistingGear =
							gearIdToAbilities[`${type}_${gearId}`];

						if (!abilitiesFromExistingGear) return;

						const gearIndex = type === "HEAD" ? 0 : type === "CLOTHES" ? 1 : 2;

						const currentAbilities = abilities[gearIndex];

						// let's not overwrite current selections
						if (!currentAbilities.every((a) => a === "UNKNOWN")) return;

						const newAbilities = clone(abilities);
						newAbilities[gearIndex] = abilitiesFromExistingGear;

						setAbilities(newAbilities);
					}}
				/>
			</div>
		</div>
	);
}

function Abilities({
	abilities,
	setAbilities,
}: {
	abilities: BuildAbilitiesTupleWithUnknown;
	setAbilities: (abilities: BuildAbilitiesTupleWithUnknown) => void;
}) {
	return (
		<div>
			<RequiredHiddenInput
				value={JSON.stringify(abilities)}
				isValid={abilities.flat().every((a) => a !== "UNKNOWN")}
				name="abilities"
			/>
			<AbilitiesSelector
				selectedAbilities={abilities}
				onChange={setAbilities}
			/>
		</div>
	);
}
