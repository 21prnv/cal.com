import { useState } from "react";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import {
  AppSkeletonLoader as SkeletonLoader,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
  Label,
  showToast,
} from "@calcom/ui";
import { AlertTriangle, Trash2 } from "@calcom/ui/components/icon";

import CreateDirectory from "./CreateDirectory";
import DirectoryInfo from "./DirectoryInfo";

const ConfigureDirectorySync = ({ teamId }: { teamId: number | null }) => {
  const { t } = useLocale();
  const utils = trpc.useContext();
  const [deleteDirectoryOpen, setDeleteDirectoryOpen] = useState(false);

  const { data, isLoading } = trpc.viewer.dsync.get.useQuery(
    { teamId },
    {
      onError: (err) => {
        showToast(err.message, "error");
      },
    }
  );

  const deleteMutation = trpc.viewer.dsync.delete.useMutation({
    async onSuccess() {
      showToast(t("directory_sync_deleted"), "success");
      await utils.viewer.dsync.invalidate();
      setDeleteDirectoryOpen(false);
    },
  });

  if (isLoading) {
    return <SkeletonLoader />;
  }

  const directory = data ? data[0] : null;

  const onDeleteConfirmation = (e: Event | React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.preventDefault();

    if (!directory) {
      return;
    }

    deleteMutation.mutate({ teamId, directoryId: directory.id });
  };

  return (
    <div>
      {!directory ? (
        <CreateDirectory teamId={teamId} />
      ) : (
        <>
          <DirectoryInfo directory={directory} />

          <hr className="border-subtle my-6" />
          <Label>{t("danger_zone")}</Label>

          {/* Delete directory sync connection */}
          <Dialog open={deleteDirectoryOpen} onOpenChange={setDeleteDirectoryOpen}>
            <DialogTrigger asChild>
              <Button color="destructive" className="mt-1" StartIcon={Trash2}>
                {t("delete_connection")}
              </Button>
            </DialogTrigger>
            <DialogContent
              title={t("directory_sync_delete_title")}
              description={t("directory_sync_delete_description")}
              type="creation"
              Icon={AlertTriangle}>
              <>
                <div className="mb-10">
                  <p className="text-default mb-4">{t("directory_sync_delete_confirmation")}</p>
                </div>
                <DialogFooter showDivider>
                  <DialogClose />
                  <Button color="primary" data-testid="delete-account-confirm" onClick={onDeleteConfirmation}>
                    {t("delete_connection")}
                  </Button>
                </DialogFooter>
              </>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default ConfigureDirectorySync;
