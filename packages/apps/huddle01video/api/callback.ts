import type { NextApiRequest, NextApiResponse } from "next";

import getInstalledAppPath from "@calcom/app-store-core/_utils/getInstalledAppPath";
import { decodeOAuthState } from "@calcom/app-store-core/_utils/oauth/decodeOAuthState";
import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { getSafeRedirectUrl } from "@calcom/lib/getSafeRedirectUrl";

import { storeHuddle01Credential } from "../utils/storage";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession({ req, res });

  const state = decodeOAuthState(req);

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = session.user.id;

  const { identityToken } = req.query;

  const token = Array.isArray(identityToken) ? identityToken[0] : identityToken;
  if (!token) {
    return res.status(401).json({
      message: "Something went wrong",
    });
  }

  await storeHuddle01Credential(userId, token);

  res.redirect(
    getSafeRedirectUrl(state?.returnTo) ?? getInstalledAppPath({ variant: "conferencing", slug: "huddle01" })
  );
}
