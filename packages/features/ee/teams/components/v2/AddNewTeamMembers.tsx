import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";

import MemberInvitationModal from "@calcom/features/ee/teams/components/MemberInvitationModal";
import { classNames } from "@calcom/lib";
import { WEBAPP_URL } from "@calcom/lib/constants";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Icon } from "@calcom/ui";
import { Avatar, Badge, Button, showToast, Switch } from "@calcom/ui/v2/core";
import { Form } from "@calcom/ui/v2/core/form";
import { SkeletonContainer, SkeletonText, SkeletonAvatar } from "@calcom/ui/v2/core/skeleton";

import { PendingMember, TeamPrices, NewTeamData, NewTeamMembersFieldArray } from "../../lib/types";
import { NewMemberForm } from "../MemberInvitationModal";

const AddNewTeamMembers = ({
  nextStep,
  teamPrices,
  newTeamData,
  addNewTeamMember,
  deleteNewTeamMember,
}: {
  nextStep: (values: { members: PendingMember[]; billingFrequency: "monthly" | "yearly" }) => void;
  teamPrices: TeamPrices;
  newTeamData: NewTeamData;
  addNewTeamMember: (newMember: PendingMember) => void;
  deleteNewTeamMember: (email: string) => void;
}) => {
  const { t } = useLocale();
  const router = useRouter();

  const [memberInviteModal, setMemberInviteModal] = useState(false);
  const [inviteMemberInput, setInviteMemberInput] = useState<NewMemberForm>({
    emailOrUsername: "",
    role: { value: "MEMBER", label: "Member" },
    sendInviteEmail: false,
  });
  const [skeletonMember, setSkeletonMember] = useState(false);
  const [billingFrequency, setBillingFrequency] = useState("monthly");

  const numberOfMembers = newTeamData.members.length;

  const formMethods = useForm({
    defaultValues: {
      members: newTeamData.members,
      billingFrequency: "monthly",
    },
  });
  const membersFieldArray = useFieldArray({
    control: formMethods.control,
    name: "members",
  });

  const { refetch } = trpc.useQuery(["viewer.teams.findUser", inviteMemberInput], {
    refetchOnWindowFocus: false,
    enabled: false,
    onSuccess: (newMember) => {
      addNewTeamMember(newMember);
      setSkeletonMember(false);
    },
    onError: (error) => {
      showToast(error.message, "error");
      setSkeletonMember(false);
    },
  });

  useEffect(() => {
    if (inviteMemberInput.emailOrUsername) {
      refetch();
    }
  }, [inviteMemberInput]);

  const handleInviteTeamMember = (values: NewMemberForm) => {
    setInviteMemberInput(values);
    setMemberInviteModal(false);
    setSkeletonMember(true);
  };

  const handleDeleteMember = (email: string) => {
    const memberIndex = formMethods
      .getValues("members")
      .findIndex((member: PendingMember) => member.email === email);
    membersFieldArray.remove(memberIndex);
    setNumberOfMembers(numberOfMembers - 1);
  };

  return (
    <>
      <Form form={formMethods} handleSubmit={(values) => nextStep(values)}>
        <>
          <div>
            <ul className="rounded-md border">
              {newTeamData.members &&
                newTeamData.members.map((member: PendingMember, index: number) => (
                  <li
                    key={member.email}
                    className={classNames(
                      "flex items-center justify-between p-6 text-sm",
                      index !== 0 && "border-t"
                    )}>
                    <div className="flex space-x-2">
                      <Avatar
                        gravatarFallbackMd5="teamMember"
                        size="mdLg"
                        imageSrc={WEBAPP_URL + "/" + member.username + "/avatar.png"}
                        alt="owner-avatar"
                      />
                      <div>
                        <div className="flex space-x-1">
                          <p>{member?.name || member?.email || t("team_member")}</p>
                          {/* Assume that the first member of the team is the creator */}
                          {index === 0 && <Badge variant="green">{t("you")}</Badge>}
                          {member.role !== "OWNER" && <Badge variant="orange">{t("pending")}</Badge>}
                          {member.role === "MEMBER" && <Badge variant="gray">{t("member")}</Badge>}
                          {member.role === "ADMIN" && <Badge variant="default">{t("admin")}</Badge>}
                          {member.sendInviteEmail && <Badge variant="blue">{t("send_email")}</Badge>}
                        </div>
                        {member.username ? (
                          <p className="text-gray-600">{`${WEBAPP_URL}/${member?.username}`}</p>
                        ) : (
                          <p className="text-gray-600">{t("not_on_cal")}</p>
                        )}
                      </div>
                    </div>
                    {member.role !== "OWNER" && (
                      <Button
                        StartIcon={Icon.FiTrash2}
                        size="icon"
                        color="secondary"
                        className="h-[36px] w-[36px]"
                        onClick={() => deleteNewTeamMember(member.email)}
                      />
                    )}
                  </li>
                ))}
              {skeletonMember && <SkeletonMember />}
            </ul>

            <Button
              color="secondary"
              data-testid="new-member-button"
              StartIcon={Icon.FiPlus}
              onClick={() => setMemberInviteModal(true)}
              className="mt-6 w-full justify-center">
              {t("add_team_member")}
            </Button>
          </div>
          <MemberInvitationModal
            isOpen={memberInviteModal}
            onExit={() => setMemberInviteModal(false)}
            onSubmit={handleInviteTeamMember}
            members={formMethods.getValues("members")}
          />

          <hr className="mb-4 mt-6" />

          <Controller
            control={formMethods.control}
            name="billingFrequency"
            defaultValue="monthly"
            render={() => (
              <div className="flex space-x-2">
                <Switch
                  onCheckedChange={(e) => {
                    formMethods.setValue("billingFrequency", e ? "yearly" : "monthly");
                    setBillingFrequency(e ? "yearly" : "monthly");
                  }}
                />
                <p>
                  Switch to yearly and save ${numberOfMembers * (teamPrices.monthly * 12 - teamPrices.yearly)}
                </p>
              </div>
            )}
          />

          <div className="mt-6 flex justify-between">
            <p>Total</p>
            <div>
              <p>
                {numberOfMembers} members × ${teamPrices[billingFrequency as keyof typeof teamPrices]} /{" "}
                {billingFrequency} = $
                {numberOfMembers * teamPrices[billingFrequency as keyof typeof teamPrices]}
              </p>
            </div>
          </div>

          <Button EndIcon={Icon.FiArrowRight} className="mt-6 w-full justify-center" type="submit">
            {t("checkout")}
          </Button>
        </>
      </Form>
    </>
  );
};

export default AddNewTeamMembers;

const AddNewTeamMemberSkeleton = () => {
  return (
    <SkeletonContainer className="rounded-md border">
      <div className="flex w-full justify-between p-4">
        <div>
          <p className="text-sm font-medium text-gray-900">
            <SkeletonText className="h-4 w-56" />
          </p>
          <div className="mt-2.5 w-max">
            <SkeletonText className="h-5 w-28" />
          </div>
        </div>
      </div>
    </SkeletonContainer>
  );
};

const SkeletonMember = () => {
  return (
    <SkeletonContainer className="rounded-md border-t text-sm">
      <div className="flex items-center justify-between p-5">
        <div className="flex">
          <SkeletonAvatar className="h-10 w-10" />
          <div>
            <p>
              <SkeletonText className="h-4 w-56" />
            </p>
            <p>
              <SkeletonText className="h-4 w-56" />
            </p>
          </div>
        </div>
        <SkeletonText className="h-7 w-7" />
      </div>
    </SkeletonContainer>
  );
};
