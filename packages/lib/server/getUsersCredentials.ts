import { prisma } from "@calcom/prisma";
import { credentialForCalendarServiceSelect } from "@calcom/prisma/selects/credential";
import type { TrpcSessionUser } from "@calcom/trpc/server/trpc";
import { getAllDomainWideDelegationCredentialsForUser } from "../domainWideDelegation/server";
type SessionUser = NonNullable<TrpcSessionUser>;
type User = { id: SessionUser["id"] };

export async function getUsersCredentials(user: User) {
  const credentials = await prisma.credential.findMany({
    where: {
      userId: user.id,
    },
    select: credentialForCalendarServiceSelect,
    orderBy: {
      id: "asc",
    },
  });

  const domainWideDelegationCredentials = await getAllDomainWideDelegationCredentialsForUser({ user });
  return [...credentials, ...domainWideDelegationCredentials];
}
