import { MembershipRole } from "@prisma/client";
import { randomBytes } from "crypto";

import { sendTeamInviteEmail } from "@calcom/emails";
import { WEBAPP_URL } from "@calcom/lib/constants";
import { getTranslation } from "@calcom/lib/server/i18n";
import { prisma } from "@calcom/prisma";

import { PendingMember } from "./types";

export const createMember = async ({
  teamId,
  teamName,
  inviter,
  pendingMember,
  teamOwnerLocale,
}: {
  teamId: number;
  teamName: string;
  inviter: string;
  pendingMember: PendingMember;
  teamOwnerLocale: string;
  teamSubscriptionActive?: boolean;
}) => {
  const translation = await getTranslation(pendingMember.locale || teamOwnerLocale || "en", "common");

  if (pendingMember.username && pendingMember.id) {
    await prisma.membership.create({
      data: {
        teamId,
        userId: pendingMember.id,
        role: pendingMember.role as MembershipRole,
      },
    });

    console.log("membership created");

    const sendEmail = await sendTeamInviteEmail({
      language: translation,
      from: inviter,
      to: pendingMember.email,
      teamName,
      joinLink: WEBAPP_URL + `/settings/teams/${teamId}/members`,
    });
    console.log("🚀 ~ file: inviteMember.ts ~ line 43 ~ sendEamil", sendEmail);
    // If user's are not on Cal.com
  } else {
    // Check if user is already in DB
    const user = await prisma.user.findUnique({
      where: {
        email: pendingMember.email,
      },
      select: {
        id: true,
      },
    });
    if (user) {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          teams: {
            create: {
              teamId: teamId,
              role: pendingMember.role as MembershipRole,
            },
          },
        },
      });
    } else {
      // If user is not in DB
      const createdMember = await prisma.user.create({
        data: {
          email: pendingMember.email,
          invitedTo: teamId,
          teams: {
            create: {
              teamId: teamId,
              role: pendingMember.role as MembershipRole,
            },
          },
        },
      });

      console.log("Creating member triggers");

      const token: string = randomBytes(32).toString("hex");

      await prisma.verificationToken.create({
        data: {
          identifier: pendingMember.email,
          token,
          expires: new Date(new Date().setHours(168)), // +1 week
        },
      });

      console.log("token created");

      const sendEmail = await sendTeamInviteEmail({
        language: translation,
        from: inviter,
        to: pendingMember.email,
        teamName: teamName,
        joinLink: `${WEBAPP_URL}/signup?token=${token}&callbackUrl=/settings/teams`,
      });

      console.log("🚀 ~ file: inviteMember.ts ~ line 98 ~ sendEmail", sendEmail);
    }
  }
};

// export const sendTeamInvite = async ({ member, inviter, teamOwnerLocale, teamId, teamName }) => {
//   if (member.role === "OWNER") return;

//   if (member.username) {
//     await sendTeamInviteEmail({
//       language: translation,
//       from: inviter,
//       to: member.email,
//       teamName,
//       joinLink: WEBAPP_URL + `/settings/teams/${teamId}/members`,
//     });
//     // Send an invite with a signup link if not a user
//   } else {
//     const token: string = randomBytes(32).toString("hex");

//     await prisma.verificationToken.create({
//       data: {
//         identifier: pendingMember.email,
//         token,
//         expires: new Date(new Date().setHours(168)), // +1 week
//       },
//     });

//     await sendTeamInviteEmail({
//       language: translation,
//       from: inviter,
//       to: member.email,
//       teamName: teamName,
//       joinLink: `${WEBAPP_URL}/signup?token=${token}&callbackUrl=/settings/teams`,
//     });
//   }
// };
