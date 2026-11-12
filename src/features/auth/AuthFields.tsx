import { useState, type ComponentProps, type ReactNode } from "react";
import { Eye, EyeOff, LockKeyhole, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
interface AuthTextFieldProps extends ComponentProps<typeof Input> {
  id: string;
  label: string;
  error?: string;
  icon: LucideIcon;
  suffix?: ReactNode;
  fieldClassName?: string;
}
export const AuthTextField = ({
  id,
  label,
  error,
  icon: Icon,
  suffix,
  fieldClassName = "",
  ...props
}: AuthTextFieldProps) => (
  <div className={`fg-login-field ${fieldClassName}`}>
    <label htmlFor={id}>{label}</label>
    <div className="fg-login-input-wrap">
      <Icon size={21} aria-hidden="true" />
      <Input
        {...props}
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {suffix}
    </div>
    {error && (
      <p id={`${id}-error`} className="fg-login-field-error" role="alert">
        {error}
      </p>
    )}
  </div>
);
export const AuthPasswordField = (
  props: Omit<AuthTextFieldProps, "icon" | "suffix" | "type">,
) => {
  const [visible, setVisible] = useState(false);
  return (
    <AuthTextField
      {...props}
      icon={LockKeyhole}
      type={visible ? "text" : "password"}
      suffix={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="fg-login-password-toggle"
          aria-label={`${visible ? "隐藏" : "显示"}${props.label}`}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={20} /> : <Eye size={20} />}
        </Button>
      }
    />
  );
};
