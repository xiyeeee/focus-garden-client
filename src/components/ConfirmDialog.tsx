import { useGarden } from "@/hooks/useGarden";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
export const ConfirmDialog = ({
  title,
  description,
  label = "确认",
  busy,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  label?: string;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) => {
  const { error } = useGarden();
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="field-error">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <Button variant="outline" disabled={busy} onClick={onClose}>
            再想一下
          </Button>
          <Button variant="destructive" disabled={busy} onClick={onConfirm}>
            {busy ? "处理中…" : label}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
