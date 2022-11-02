import { Elements, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { z } from "zod";

// import TeamGeneralSettings from "@calcom/features/teams/createNewTeam/TeamGeneralSettings";
import AddNewTeamMembers from "@calcom/features/ee/teams/components/v2/AddNewTeamMembers";
import CreateNewTeam from "@calcom/features/ee/teams/components/v2/CreateNewTeam";
import { NewTeamFormValues, PendingMember, NewTeamData } from "@calcom/features/ee/teams/lib/types";
import { STRIPE_PUBLISHABLE_KEY } from "@calcom/lib/constants";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { localStorage } from "@calcom/lib/webstorage";
import { trpc } from "@calcom/trpc/react";

import { StepCard } from "@components/getting-started/components/StepCard";
import { Steps } from "@components/getting-started/components/Steps";

import PurchaseNewTeam from "../../../../components/team/PurchaseNewTeam";

const stripe = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

const INITIAL_STEP = "create-a-new-team";
// TODO: Add teams general settings "general-settings"
const steps = ["create-a-new-team", "add-team-members", "purchase-new-team"] as const;

const stepTransform = (step: typeof steps[number]) => {
  const stepIndex = steps.indexOf(step);
  if (stepIndex > -1) {
    return steps[stepIndex];
  }
  return INITIAL_STEP;
};

const stepRouteSchema = z.object({
  step: z.array(z.enum(steps)).default([INITIAL_STEP]),
});

const CreateNewTeamPage = () => {
  const router = useRouter();
  const [newTeamData, setNewTeamData] = useState<NewTeamData>({
    name: "",
    slug: "",
    logo: "",
    members: [],
    billingFrequency: "monthly",
  });
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntent, setPaymentIntent] = useState("");
  const [teamPrices, setTeamPrices] = useState({});

  const { t, i18n } = useLocale();

  const result = stepRouteSchema.safeParse(router.query);
  const currentStep = result.success ? result.data.step[0] : INITIAL_STEP;

  const headers = [
    {
      title: `${t("create_new_team")}`,
      subtitle: [`${t("create_new_team_description")}`],
    },
    // {
    //   title: `${t("general_settings")}`,
    //   subtitle: [`${t("general_settings_description")}`],
    // },
    {
      title: `${t("add_team_members")}`,
      subtitle: [`${t("add_team_members_description")}`],
    },
    {
      title: `${t("purchase_team_subscription")}`,
      subtitle: [`${t("purchase_team_subscription_description")}`],
    },
  ];

  const goToIndex = (index: number) => {
    const newStep = steps[index];
    router.push(
      {
        pathname: `/settings/teams/new/${stepTransform(newStep)}`,
      },
      undefined
    );
  };

  const currentStepIndex = steps.indexOf(currentStep);

  const createPaymentIntentMutation = trpc.useMutation(["viewer.teams.createPaymentIntent"], {
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      goToIndex(2);
    },
  });

  const getTeamPricesQuery = trpc.useQuery(["viewer.teams.getTeamPrices"], {
    onSuccess: (data) => {
      setTeamPrices(data);
    },
  });

  return (
    <div
      className="dark:bg-brand dark:text-brand-contrast min-h-screen text-black"
      data-testid="onboarding"
      key={router.asPath}>
      <Head>
        <title>Create a new Team</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>
        <Toaster position="bottom-right" />
      </div>
      <div className="mx-auto px-4 py-24">
        <div className="relative">
          <div className="sm:mx-auto sm:w-full sm:max-w-[600px]">
            <div className="mx-auto sm:max-w-[520px]">
              <header>
                <p className="font-cal mb-3 text-[28px] font-medium leading-7">
                  {headers[currentStepIndex]?.title || "Undefined title"}
                </p>

                <p className="font-sans text-sm font-normal text-gray-500">
                  {headers[currentStepIndex]?.subtitle}
                </p>
              </header>
              <Steps maxSteps={steps.length} currentStep={currentStepIndex} navigateToStep={goToIndex} />
            </div>
            <StepCard>
              {currentStep === "create-a-new-team" && (
                <CreateNewTeam
                  nextStep={(values: NewTeamFormValues) => {
                    setNewTeamData({ ...values, members: [] });
                    goToIndex(1);
                  }}
                />
              )}

              {/* {currentStep === "general-settings" && (
                <TeamGeneralSettings teamId={teamId} nextStep={() => goToIndex(2)} />
              )} */}

              {currentStep === "add-team-members" && (
                <AddNewTeamMembers
                  teamPrices={teamPrices}
                  nextStep={(values: {
                    members: PendingMember[];
                    billingFrequency: "monthly" | "yearly";
                  }) => {
                    console.log("🚀 ~ file: [[...step]].tsx ~ line 148 ~ CreateNewTeamPage ~ values", values);
                    createPaymentIntentMutation.mutate({
                      teamName: newTeamData.name,
                      billingFrequency: values.billingFrequency,
                      seats: values.members.length,
                    });
                    setNewTeamData({
                      ...newTeamData,
                      members: [...values.members],
                      billingFrequency: values.billingFrequency,
                    });
                  }}
                />
              )}

              {currentStep === "purchase-new-team" && (
                <Elements stripe={stripe} options={{ clientSecret }}>
                  <PurchaseNewTeam
                    paymentIntent={paymentIntent}
                    clientSecret={clientSecret}
                    total={
                      newTeamData.members.length *
                      teamPrices[newTeamData.billingFrequency as keyof typeof teamPrices]
                    }
                    newTeamData={newTeamData}
                  />
                </Elements>
              )}
            </StepCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateNewTeamPage;
