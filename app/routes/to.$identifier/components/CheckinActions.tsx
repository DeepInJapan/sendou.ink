// TODO: Warning: Text content did not match. Server: "57" Client: "56"
import * as React from "react";
import { Form, useLoaderData, useTransition } from "@remix-run/react";
import { ActionSectionWrapper } from "./ActionSectionWrapper";
import { Button } from "~/components/Button";
import { useUser } from "~/modules/auth";
import { CheckInIcon } from "~/components/icons/CheckIn";
import { SuccessIcon } from "~/components/icons/Success";
import { AlertIcon } from "~/components/icons/Alert";
import { ErrorIcon } from "~/components/icons/Error";
import { checkInClosesDate } from "~/modules/tournament/utils";
import { TOURNAMENT } from "~/constants";
import type { TournamentLoader } from "../../to.$identifier";
import { databaseTimestampToDate } from "~/utils/dates";

// TODO: warning when not registered but check in is open
export function CheckinActions() {
  const tournament = useLoaderData<TournamentLoader>();
  const user = useUser();
  const transition = useTransition();

  const timeInMinutesBeforeCheckInCloses = React.useCallback(() => {
    return Math.floor(
      (checkInClosesDate(
        databaseTimestampToDate(tournament.startTime)
      ).getTime() -
        new Date().getTime()) /
        (1000 * 60)
    );
  }, [tournament.startTime]);
  const [minutesTillCheckInCloses, setMinutesTillCheckInCloses] =
    React.useState(timeInMinutesBeforeCheckInCloses());

  React.useEffect(() => {
    const timeout = setInterval(() => {
      setMinutesTillCheckInCloses(timeInMinutesBeforeCheckInCloses());
    }, 1000 * 15);

    return () => clearTimeout(timeout);
  }, [timeInMinutesBeforeCheckInCloses]);

  const ownTeam = tournament.teams.find((team) =>
    team.members.some((member) => member.isOwner && member.id === user?.id)
  );

  const tournamentHasStarted = tournament.brackets.some((b) => b.rounds.length);
  if (!ownTeam || tournamentHasStarted) {
    return null;
  }

  if (ownTeam.checkedInTime) {
    return (
      <ActionSectionWrapper icon="success" data-cy="checked-in-alert">
        <SuccessIcon /> Your team is checked in!
      </ActionSectionWrapper>
    );
  }

  const checkInHasStarted = new Date(tournament.checkInStartTime) < new Date();
  const teamHasEnoughMembers =
    ownTeam.members.length >= TOURNAMENT.TEAM_MIN_MEMBERS_FOR_FULL;

  if (!checkInHasStarted && !teamHasEnoughMembers) {
    return (
      <ActionSectionWrapper icon="warning" data-cy="team-size-alert">
        <AlertIcon /> You need at least 4 players in your roster to play
      </ActionSectionWrapper>
    );
  }

  const differenceInMinutesBetweenCheckInAndStart = Math.floor(
    (new Date(tournament.startTime).getTime() -
      new Date(tournament.checkInStartTime).getTime()) /
      (1000 * 60)
  );

  if (!checkInHasStarted && teamHasEnoughMembers) {
    return (
      <ActionSectionWrapper icon="info">
        <AlertIcon /> Check-in starts{" "}
        {differenceInMinutesBetweenCheckInAndStart} minutes before the
        tournament starts
      </ActionSectionWrapper>
    );
  }

  if (
    checkInHasStarted &&
    !teamHasEnoughMembers &&
    minutesTillCheckInCloses > 0
  ) {
    return (
      <ActionSectionWrapper icon="warning" data-cy="not-enough-players-warning">
        <AlertIcon /> You need at least 4 players in your roster to play.
        Check-in is open for {minutesTillCheckInCloses} more{" "}
        {minutesTillCheckInCloses > 1 ? "minutes" : "minute"}
      </ActionSectionWrapper>
    );
  }

  if (
    checkInHasStarted &&
    teamHasEnoughMembers &&
    minutesTillCheckInCloses > 0
  ) {
    return (
      <ActionSectionWrapper
        icon={minutesTillCheckInCloses <= 1 ? "warning" : "info"}
        data-cy="check-in-alert"
      >
        {minutesTillCheckInCloses > 1 ? (
          <>
            <AlertIcon /> Check-in is open for {minutesTillCheckInCloses} more
            minutes
          </>
        ) : (
          <>
            <AlertIcon /> Check-in closes in less than a minute
          </>
        )}
        <Form
          method="post"
          className="tournament__action-section__button-container"
        >
          <input type="hidden" name="_action" value="CHECK_IN" />
          <input type="hidden" name="teamId" value={ownTeam.id} />
          <Button
            variant="outlined"
            type="submit"
            loading={transition.state !== "idle"}
            icon={<CheckInIcon />}
            data-cy="check-in-button"
          >
            Check-in
          </Button>
        </Form>
      </ActionSectionWrapper>
    );
  }

  return (
    <ActionSectionWrapper icon="error">
      <ErrorIcon /> Check-in has closed. Your team is not checked in
    </ActionSectionWrapper>
  );
}
