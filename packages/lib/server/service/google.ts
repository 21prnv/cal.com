import type { Credentials } from "google-auth-library";
import type { OAuth2Client } from "google-auth-library";
import type { calendar_v3 } from "googleapis";
import { google } from "googleapis";

import logger from "@calcom/lib/logger";

import { CredentialRepository } from "../repository/credential";
import { SelectedCalendarRepository } from "../repository/selectedCalendar";
import { UserRepository } from "../repository/user";

export class GoogleService {
  static async createGoogleCalendarCredential({ userId, key }: { userId: number; key: Credentials }) {
    return await CredentialRepository.create({
      type: "google_calendar",
      key,
      userId,
      appId: "google-calendar",
    });
  }

  static async createGoogleMeetsCredential({ userId }: { userId: number }) {
    return await CredentialRepository.create({
      type: "google_video",
      key: {},
      userId,
      appId: "google-meet",
    });
  }

  static async createSelectedCalendar(data: { credentialId: number; userId: number; externalId: string }) {
    return await SelectedCalendarRepository.create({
      ...data,
      integration: "google_calendar",
    });
  }

  static async findGoogleMeetCredential({ userId }: { userId: number }) {
    return await CredentialRepository.findFirstByUserIdAndType({
      userId,
      type: "google_video",
    });
  }

  static async findGoogleCalendarCredential({ userId }: { userId: number }) {
    return await CredentialRepository.findFirstByAppIdAndUserId({
      appId: "google-calendar",
      userId,
    });
  }

  static async getAllCalendars(
    calendar: calendar_v3.Calendar,
    fields: string[] = ["id", "summary", "primary", "accessRole"]
  ): Promise<calendar_v3.Schema$CalendarListEntry[]> {
    let allCalendars: calendar_v3.Schema$CalendarListEntry[] = [];
    let pageToken: string | undefined;

    try {
      do {
        const response: any = await calendar.calendarList.list({
          fields: `items(${fields.join(",")}),nextPageToken`,
          pageToken,
          maxResults: 250, // 250 is max
        });

        allCalendars = [...allCalendars, ...(response.data.items ?? [])];
        pageToken = response.data.nextPageToken;

        logger.error("Google Calendar pagination failed in the middle", {
          totalSoFar: allCalendars.length,
          hasMorePages: !!pageToken,
        });
      } while (pageToken);

      return allCalendars;
    } catch (error) {
      logger.error("Error fetching all Google Calendars", { error });
      throw error;
    }
  }

  static async updateProfilePhoto(oAuth2Client: OAuth2Client, userId: number) {
    try {
      const oauth2 = google.oauth2({ version: "v2", auth: oAuth2Client });
      const userDetails = await oauth2.userinfo.get();
      if (userDetails.data?.picture) {
        await UserRepository.updateAvatar({ id: userId, avatarUrl: userDetails.data.picture });
      }
    } catch (error) {
      logger.error("Error updating avatarUrl from google calendar connect", error);
    }
  }
}
