import { expect, type Page } from "@playwright/test";

import dayjs from "@calcom/dayjs";
import { randomString } from "@calcom/lib/random";

import { localize } from "../lib/testUtils";
import type { createUsersFixture } from "./users";

const reschedulePlaceholderText = "Let others know why you need to reschedule";
export const scheduleSuccessfullyText = "This meeting is scheduled";

const EMAIL = "test@test.com";
const EMAIL2 = "test2@test.com";
const PHONE = "+55 (32) 983289947";

type BookingOptions = {
  hasPlaceholder?: boolean;
  isReschedule?: boolean;
  isRequired?: boolean;
  isAllRequired?: boolean;
  isMultiSelect?: boolean;
};

type teamBookingtypes = { isManagedType?: boolean; isRoundRobinType?: boolean; isCollectiveType?: boolean };

interface QuestionActions {
  [key: string]: () => Promise<void>;
}

type customLocators = {
  shouldChangeSelectLocator: boolean;
  shouldUseLastRadioGroupLocator: boolean;
  shouldUseFirstRadioGroupLocator: boolean;
  shouldChangeMultiSelectLocator: boolean;
};

type fillAndConfirmBookingParams = {
  eventTypePage: Page;
  placeholderText: string;
  question: string;
  fillText: string;
  secondQuestion: string;
  options: BookingOptions;
};

type UserFixture = ReturnType<typeof createUsersFixture>;

function isLastDayOfMonth(): boolean {
  const today = dayjs();
  const endOfMonth = today.endOf("month");
  return today.isSame(endOfMonth, "day");
}

const fillQuestion = async (eventTypePage: Page, questionType: string, customLocators: customLocators) => {
  const questionActions: QuestionActions = {
    phone: async () => {
      await eventTypePage.locator('input[name="phone-test"]').clear();
      await eventTypePage.locator('input[name="phone-test"]').fill(PHONE);
    },
    multiemail: async () => {
      await eventTypePage.getByRole("button", { name: `${questionType} test` }).click();
      await eventTypePage.getByPlaceholder(`${questionType} test`).fill(EMAIL);
      await eventTypePage.getByTestId("add-another-guest").last().click();
      await eventTypePage.getByPlaceholder(`${questionType} test`).last().fill(EMAIL2);
    },
    checkbox: async () => {
      if (customLocators.shouldUseLastRadioGroupLocator || customLocators.shouldChangeMultiSelectLocator) {
        await eventTypePage.getByLabel("Option 1").last().click();
        await eventTypePage.getByLabel("Option 2").last().click();
      } else if (customLocators.shouldUseFirstRadioGroupLocator) {
        await eventTypePage.getByLabel("Option 1").first().click();
        await eventTypePage.getByLabel("Option 2").first().click();
      } else {
        await eventTypePage.getByLabel("Option 1").click();
        await eventTypePage.getByLabel("Option 2").click();
      }
    },
    multiselect: async () => {
      if (customLocators.shouldChangeMultiSelectLocator) {
        await eventTypePage.getByLabel("multi-select-dropdown").click();
        await eventTypePage.getByTestId("select-option-Option 1").click();
      } else {
        await eventTypePage.getByLabel("multi-select-dropdown").last().click();
        await eventTypePage.getByTestId("select-option-Option 1").click();
      }
    },
    boolean: async () => {
      await eventTypePage.getByLabel(`${questionType} test`).check();
    },
    radio: async () => {
      await eventTypePage.locator('[id="radio-test\\.option\\.0\\.radio"]').click();
    },
    select: async () => {
      if (customLocators.shouldChangeSelectLocator) {
        await eventTypePage.getByLabel("select-dropdown").first().click();
        await eventTypePage.getByTestId("select-option-Option 1").click();
      } else {
        await eventTypePage.getByLabel("select-dropdown").last().click();
        await eventTypePage.getByTestId("select-option-Option 1").click();
      }
    },
    number: async () => {
      await eventTypePage.getByPlaceholder(`${questionType} test`).click();
      await eventTypePage.getByPlaceholder(`${questionType} test`).fill("123");
    },
    address: async () => {
      await eventTypePage.getByPlaceholder(`${questionType} test`).click();
      await eventTypePage.getByPlaceholder(`${questionType} test`).fill("address test");
    },
    textarea: async () => {
      await eventTypePage.getByPlaceholder(`${questionType} test`).click();
      await eventTypePage.getByPlaceholder(`${questionType} test`).fill("textarea test");
    },
    text: async () => {
      await eventTypePage.getByPlaceholder(`${questionType} test`).click();
      await eventTypePage.getByPlaceholder(`${questionType} test`).fill("text test");
    },
  };
  if (questionActions[questionType]) {
    await questionActions[questionType]();
  }
};

const fillAllQuestions = async (eventTypePage: Page, questions: string[], options: BookingOptions) => {
  if (options.isAllRequired) {
    for (const question of questions) {
      switch (question) {
        case "email":
          await eventTypePage.getByPlaceholder("Email").click();
          await eventTypePage.getByPlaceholder("Email").fill(EMAIL);
          break;
        case "phone":
          await eventTypePage.getByPlaceholder("Phone test").click();
          await eventTypePage.getByPlaceholder("Phone test").fill(PHONE);
          break;
        case "address":
          await eventTypePage.getByPlaceholder("Address test").click();
          await eventTypePage.getByPlaceholder("Address test").fill("123 Main St, City, Country");
          break;
        case "textarea":
          await eventTypePage.getByPlaceholder("Textarea test").click();
          await eventTypePage.getByPlaceholder("Textarea test").fill("This is a sample text for textarea.");
          break;
        case "select":
          await eventTypePage.getByLabel("select-dropdown").last().click();
          await eventTypePage.getByTestId("select-option-Option 1").click();
          break;
        case "multiselect":
          // select-dropdown
          await eventTypePage.getByLabel("multi-select-dropdown").click();
          await eventTypePage.getByTestId("select-option-Option 1").click();
          break;
        case "number":
          await eventTypePage.getByLabel("number test").click();
          await eventTypePage.getByLabel("number test").fill("123");
          break;
        case "radio":
          await eventTypePage.getByRole("radiogroup").getByText("Option 1").check();
          break;
        case "text":
          await eventTypePage.getByPlaceholder("Text test").click();
          await eventTypePage.getByPlaceholder("Text test").fill("Sample text");
          break;
        case "checkbox":
          await eventTypePage.getByLabel("Option 1").first().check();
          await eventTypePage.getByLabel("Option 2").first().check();
          break;
        case "boolean":
          await eventTypePage.getByLabel(`${question} test`).check();
          break;
        case "multiemail":
          await eventTypePage.getByRole("button", { name: "multiemail test" }).click();
          await eventTypePage.getByPlaceholder("multiemail test").fill(EMAIL);
          break;
      }
    }
  }
};

export async function loginUser(users: UserFixture) {
  const pro = await users.create({ name: "testuser" });
  await pro.apiLogin();
}

const goToNextMonthIfNoAvailabilities = async (eventTypePage: Page) => {
  try {
    if (isLastDayOfMonth()) {
      await eventTypePage.getByTestId("view_next_month").waitFor({ timeout: 6000 });
      await eventTypePage.getByTestId("view_next_month").click();
    }
  } catch (err) {
    console.info("No need to click on view next month button");
  }
};

export function createBookingPageFixture(page: Page) {
  return {
    goToEventType: async (
      eventType: string,
      options?: {
        clickOnFirst?: boolean;
        clickOnLast?: boolean;
      }
    ) => {
      if (options?.clickOnFirst) {
        await page.getByRole("link", { name: eventType }).first().click();
      }
      if (options?.clickOnLast) {
        await page.getByRole("link", { name: eventType }).last().click();
      } else {
        await page.getByRole("link", { name: eventType }).click();
      }
    },
    goToTab: async (tabName: string) => {
      await page.getByTestId(`vertical-tab-${tabName}`).click();
    },
    addQuestion: async (
      questionType: string,
      identifier: string,
      label: string,
      isRequired: boolean,
      placeholder?: string
    ) => {
      await page.getByTestId("add-field").click();
      await page.getByTestId("test-field-type").click();
      await page.getByTestId(`select-option-${questionType}`).click();
      await page.getByLabel("Identifier").dblclick();
      await page.getByLabel("Identifier").fill(identifier);
      await page.getByLabel("Label").click();
      await page.getByLabel("Label").fill(label);
      if (placeholder) {
        await page.getByLabel("Placeholder").click();
        await page.getByLabel("Placeholder").fill(placeholder);
      }
      if (!isRequired) {
        await page.getByRole("radio", { name: "No" }).click();
      }
      await page.getByTestId("field-add-save").click();
    },
    updateEventType: async (options?: { shouldCheck: boolean; name: string }) => {
      await page.getByTestId("update-eventtype").click();
      options?.shouldCheck &&
        (await expect(
          page.getByRole("button", { name: `${options?.name} event type updated successfully` })
        ).toBeVisible());
    },
    previewEventType: async () => {
      const eventtypePromise = page.waitForEvent("popup");
      await page.getByTestId("preview-button").click();
      return eventtypePromise;
    },
    selectTimeSlot: async (eventTypePage: Page) => {
      await goToNextMonthIfNoAvailabilities(eventTypePage);
      await eventTypePage.getByTestId("time").first().click();
    },
    clickReschedule: async () => {
      await page.getByText("Reschedule").click();
    },

    selectFirstAvailableTime: async () => {
      await page.getByTestId("time").first().click();
    },

    fillRescheduleReasonAndConfirm: async () => {
      await page.getByPlaceholder(reschedulePlaceholderText).click();
      await page.getByPlaceholder(reschedulePlaceholderText).fill("Test reschedule");
      await page.getByTestId("confirm-reschedule-button").click();
    },

    cancelBookingWithReason: async (page: Page) => {
      await page.getByTestId("cancel").click();
      await page.getByTestId("cancel_reason").fill("Test cancel");
      await page.getByTestId("confirm_cancel").click();
    },
    assertBookingCanceled: async (page: Page) => {
      await expect(page.getByTestId("cancelled-headline")).toBeVisible();
    },

    rescheduleBooking: async (eventTypePage: Page) => {
      await goToNextMonthIfNoAvailabilities(eventTypePage);
      await eventTypePage.getByText("Reschedule").click();
      while (await eventTypePage.getByRole("button", { name: "View next" }).isVisible()) {
        await eventTypePage.getByRole("button", { name: "View next" }).click();
      }
      await eventTypePage.getByTestId("time").first().click();
      await eventTypePage.getByPlaceholder(reschedulePlaceholderText).click();
      await eventTypePage.getByPlaceholder(reschedulePlaceholderText).fill("Test reschedule");
      await eventTypePage.getByTestId("confirm-reschedule-button").click();
      await eventTypePage.waitForTimeout(400);
      if (
        await eventTypePage.getByRole("heading", { name: "Could not reschedule the meeting." }).isVisible()
      ) {
        await eventTypePage.getByTestId("back").click();
        await eventTypePage.getByTestId("time").last().click();
        await eventTypePage.getByTestId("confirm-reschedule-button").click();
      }
    },

    assertBookingRescheduled: async (page: Page) => {
      await expect(page.getByText(scheduleSuccessfullyText)).toBeVisible();
    },

    cancelBooking: async (eventTypePage: Page) => {
      await eventTypePage.getByTestId("cancel").click();
      await eventTypePage.getByTestId("cancel_reason").fill("Test cancel");
      await eventTypePage.getByTestId("confirm_cancel").click();
      await expect(eventTypePage.getByTestId("cancelled-headline")).toBeVisible();
    },

    fillAndConfirmBooking: async ({
      eventTypePage,
      placeholderText,
      question,
      fillText,
      secondQuestion,
      options,
    }: fillAndConfirmBookingParams) => {
      const confirmButton = options.isReschedule ? "confirm-reschedule-button" : "confirm-book-button";

      await expect(eventTypePage.getByText(`${secondQuestion} test`).first()).toBeVisible();
      await eventTypePage.getByPlaceholder(placeholderText).fill(fillText);

      // Change the selector for specifics cases related to select question
      const shouldChangeSelectLocator = (question: string, secondQuestion: string): boolean =>
        question === "select" && ["multiemail", "multiselect", "address"].includes(secondQuestion);

      const shouldUseLastRadioGroupLocator = (question: string, secondQuestion: string): boolean =>
        question === "radio" && secondQuestion === "checkbox";

      const shouldUseFirstRadioGroupLocator = (question: string, secondQuestion: string): boolean =>
        question === "checkbox" && secondQuestion === "radio";

      const shouldChangeMultiSelectLocator = (question: string, secondQuestion: string): boolean =>
        question === "multiselect" &&
        ["address", "checkbox", "multiemail", "select"].includes(secondQuestion);

      const customLocators = {
        shouldChangeSelectLocator: shouldChangeSelectLocator(question, secondQuestion),
        shouldUseLastRadioGroupLocator: shouldUseLastRadioGroupLocator(question, secondQuestion),
        shouldUseFirstRadioGroupLocator: shouldUseFirstRadioGroupLocator(question, secondQuestion),
        shouldChangeMultiSelectLocator: shouldChangeMultiSelectLocator(question, secondQuestion),
      };

      // Fill the first question
      await fillQuestion(eventTypePage, question, customLocators);

      // Fill the second question if is required
      options.isRequired && (await fillQuestion(eventTypePage, secondQuestion, customLocators));

      await eventTypePage.getByTestId(confirmButton).click();
      await eventTypePage.waitForTimeout(400);
      if (await eventTypePage.getByRole("heading", { name: "Could not book the meeting." }).isVisible()) {
        await eventTypePage.getByTestId("back").click();
        await eventTypePage.getByTestId("time").last().click();
        await fillQuestion(eventTypePage, question, customLocators);
        options.isRequired && (await fillQuestion(eventTypePage, secondQuestion, customLocators));
        await eventTypePage.getByTestId(confirmButton).click();
      }
      const scheduleSuccessfullyPage = eventTypePage.getByText(scheduleSuccessfullyText);
      await scheduleSuccessfullyPage.waitFor({ state: "visible" });
      await expect(scheduleSuccessfullyPage).toBeVisible();
    },

    checkField: async (question: string, options?: { isOptional: boolean }) => {
      if (options?.isOptional) {
        await expect(page.getByTestId(`field-${question}-test`).getByText("Optional")).toBeVisible();
      } else {
        await expect(page.getByTestId(`field-${question}-test`).getByText("Required")).toBeVisible();
      }
      await expect(page.getByTestId(`field-${question}-test`)).toBeVisible();
    },
    fillAllQuestions: async (eventTypePage: Page, questions: string[], options: BookingOptions) => {
      const confirmButton = options.isReschedule ? "confirm-reschedule-button" : "confirm-book-button";
      await fillAllQuestions(eventTypePage, questions, options);
      await eventTypePage.getByTestId(confirmButton).click();
      await eventTypePage.waitForTimeout(400);
      if (await eventTypePage.getByRole("heading", { name: "Could not book the meeting." }).isVisible()) {
        await eventTypePage.getByTestId("back").click();
        await eventTypePage.getByTestId("time").last().click();
        await fillAllQuestions(eventTypePage, questions, options);
        await eventTypePage.getByTestId(confirmButton).click();
      }
      const scheduleSuccessfullyPage = eventTypePage.getByText(scheduleSuccessfullyText);
      await scheduleSuccessfullyPage.waitFor({ state: "visible" });
      await expect(scheduleSuccessfullyPage).toBeVisible();
    },
    createTeam: async (name: string) => {
      const teamsText = (await localize("en"))("teams");
      const continueText = (await localize("en"))("continue");
      const publishTeamText = (await localize("en"))("team_publish");

      await page.getByRole("link", { name: teamsText }).click();
      await page.getByTestId("new-team-btn").click();
      await page.getByPlaceholder("Acme Inc.").click();
      await page.getByPlaceholder("Acme Inc.").fill(`${name}-${randomString(3)}`);
      await page.getByRole("button", { name: continueText }).click();
      await page.getByRole("button", { name: publishTeamText }).click();

      await page.getByTestId("vertical-tab-Back").click();
    },
    createTeamEventType: async (name: string, options: teamBookingtypes) => {
      await page.getByTestId("new-event-type").click();
      await page.getByTestId("option-0").click();

      // We first simulate to create a default event type to check if managed option is not available

      const managedEventDescription = (await localize("en"))("managed_event_description");
      const roundRobinEventDescription = (await localize("en"))("round_robin_description");
      const collectiveEventDescription = (await localize("en"))("collective_description");
      const quickChatText = (await localize("en"))("quick_chat");
      await expect(page.locator("div").filter({ hasText: managedEventDescription })).toBeHidden();
      await page.getByTestId("dialog-rejection").click();

      await page.getByTestId("new-event-type").click();
      await page.getByTestId("option-team-1").click();
      await page.getByPlaceholder(quickChatText).fill(name);
      if (options.isCollectiveType) {
        await page
          .locator("div")
          .filter({ hasText: `Collective${collectiveEventDescription}` })
          .getByRole("radio")
          .first()
          .click();
      }

      if (options.isRoundRobinType) {
        await page
          .locator("div")
          .filter({ hasText: `Round Robin${roundRobinEventDescription}` })
          .getByRole("radio")
          .nth(1)
          .click();
      }

      if (options.isManagedType) {
        await page
          .locator("div")
          .filter({ hasText: `Managed Event${managedEventDescription}` })
          .getByRole("radio")
          .last()
          .click();

        const managedEventClarification = (await localize("en"))("managed_event_url_clarification");
        await expect(page.getByText(managedEventClarification)).toBeVisible();
      }

      const continueText = (await localize("en"))("continue");

      await page.getByRole("button", { name: continueText }).click();
      await expect(page.getByRole("button", { name: "event type created successfully" })).toBeVisible();
      await page.getByTestId("update-eventtype").click();
    },
    removeManagedEventType: async () => {
      await page
        .locator("header")
        .filter({ hasText: "Test Managed Event TypeSave" })
        .getByRole("button")
        .first()
        .click();

      // Check if the correct messages is showed in the dialog
      const deleteManagedEventTypeDescription = (await localize("en"))(
        "delete_managed_event_type_description"
      );
      const confirmDeleteEventTypeText = (await localize("en"))("deleteManagedEventTypeDescription");
      await expect(page.getByText(deleteManagedEventTypeDescription)).toBeVisible();
      await page.getByRole("button", { name: confirmDeleteEventTypeText }).click();

      // Check if the correct image is showed when there is no event type
      await expect(page.getByTestId("empty-screen")).toBeVisible();
    },
    assertManagedEventTypeDeleted: async () => {
      const eventTypeDeletedText = (await localize("en"))("event_type_deleted_successfully");
      await expect(page.getByRole("button", { name: eventTypeDeletedText })).toBeVisible();
    },
    deleteTeam: async () => {
      const teamsText = (await localize("en"))("teams");
      const teamLogoText = (await localize("en"))("team_logo");
      const disbandTeamText = (await localize("en"))("disband_team");
      const confirmDisbandTeamText = (await localize("en"))("confirm_disband_team");
      await page.getByRole("link", { name: teamsText }).click();
      await page.getByRole("link", { name: `${teamLogoText} Test Team` }).click();
      await page.getByRole("button", { name: disbandTeamText }).click();
      await page.getByRole("button", { name: confirmDisbandTeamText }).click();

      // Check if the correct image is showed when there is no team
      await expect(page.getByRole("img", { name: "Cal.com is better with teams" })).toBeVisible();
    },
    assertTeamDeleted: async () => {
      const teamDisbandedText = (await localize("en"))("your_team_disbanded_successfully");
      await expect(page.getByRole("button", { name: teamDisbandedText })).toBeVisible();
    },
    removeQuestion: async (question: string) => {
      await page.getByTestId(`field-${question}-test`).getByTestId("delete-field").click();
    },
    editQuestion: async (question: string, options?: { shouldBeRequired: boolean }) => {
      await page.getByTestId(`field-${question}-test`).getByTestId("edit-field-action").click();
      options?.shouldBeRequired
        ? await page.getByRole("radio", { name: "Yes" }).click()
        : await page.getByRole("radio", { name: "No" }).click();
      await page.getByTestId("field-add-save").click();
    },
  };
}
