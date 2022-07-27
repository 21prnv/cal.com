import { Prisma, SchedulingType } from "@prisma/client";
import { useMemo } from "react";
import { FormattedNumber, IntlProvider } from "react-intl";

import { parseRecurringEvent } from "@calcom/lib";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { baseEventTypeSelect } from "@calcom/prisma/selects";
import { Icon } from "@calcom/ui";
import { Badge } from "@calcom/ui/v2";

import classNames from "@lib/classNames";

const eventTypeData = Prisma.validator<Prisma.EventTypeArgs>()({
  select: baseEventTypeSelect,
});

type EventType = Prisma.EventTypeGetPayload<typeof eventTypeData>;

export type EventTypeDescriptionProps = {
  eventType: EventType;
  className?: string;
};

export const EventTypeDescription = ({ eventType, className }: EventTypeDescriptionProps) => {
  const { t } = useLocale();

  const recurringEvent = useMemo(
    () => parseRecurringEvent(eventType.recurringEvent),
    [eventType.recurringEvent]
  );

  return (
    <>
      <div className={classNames("text-neutral-500 dark:text-white", className)}>
        {eventType.description && (
          <h2 className="max-w-[280px] overflow-hidden text-ellipsis py-1 leading-4 text-gray-600 opacity-60 sm:max-w-[500px]">
            {eventType.description.substring(0, 100)}
            {eventType.description.length > 100 && "..."}
          </h2>
        )}
        <ul className="mt-2 flex flex-wrap space-x-2 sm:flex-nowrap">
          <li>
            <Badge variant="gray" size="lg" StartIcon={Icon.Clock}>
              {eventType.length}m
            </Badge>
          </li>
          {eventType.schedulingType ? (
            <li>
              <Badge variant="gray" size="lg" StartIcon={Icon.User}>
                {eventType.schedulingType === SchedulingType.ROUND_ROBIN && t("round_robin")}
                {eventType.schedulingType === SchedulingType.COLLECTIVE && t("collective")}
              </Badge>
            </li>
          ) : (
            <li>
              <Badge variant="gray" size="lg" StartIcon={Icon.User}>
                {t("1_on_1")}
              </Badge>
            </li>
          )}
          {recurringEvent?.count && recurringEvent.count > 0 && (
            <li>
              <Badge variant="gray" size="lg" StartIcon={Icon.RefreshCw}>
                {t("repeats_up_to", {
                  count: recurringEvent.count,
                })}
              </Badge>
            </li>
          )}
          {eventType.price > 0 && (
            <li>
              <Badge variant="gray" size="lg" StartIcon={Icon.CreditCard}>
                <IntlProvider locale="en">
                  <FormattedNumber
                    value={eventType.price / 100.0}
                    style="currency"
                    currency={eventType.currency.toUpperCase()}
                  />
                </IntlProvider>
              </Badge>
            </li>
          )}
          {eventType.requiresConfirmation && (
            <li>
              <Badge variant="gray" size="lg" StartIcon={Icon.Clipboard}>
                {t("requires_confirmation")}
              </Badge>
            </li>
          )}
        </ul>
      </div>
    </>
  );
};

export default EventTypeDescription;
