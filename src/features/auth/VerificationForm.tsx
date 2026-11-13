import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { KeyRound, LoaderCircle, Mail, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { authApi } from '@/services/auth/api'
import { ApiError, errorMessage } from '@/services/http'
import { useCooldown } from '@/hooks/useCooldown'
import { useAuth } from './AuthProvider'
import { AuthTextField, AuthPasswordField } from './AuthFields'
import { validateEmail, validatePassword } from './login-form'
type Field =
  | 'email'
  | 'verificationCode'
  | 'password'
  | 'confirmation'
  | 'nickname'
export const VerificationForm = ({ mode }: { mode: 'register' | 'reset' }) => {
  const registering = mode === 'register'
  const navigate = useNavigate()
  const { clearSession } = useAuth()
  const [values, setValues] = useState({
    email: '',
    verificationCode: '',
    password: '',
    confirmation: '',
    nickname: '',
  })
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [sending, setSending] = useState(false)
  const [saving, setSaving] = useState(false)
  const sendPending = useRef(false)
  const savePending = useRef(false)
  const sendCooldown = useCooldown()
  const submitCooldown = useCooldown()
  const change = (field: Field, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setError('')
    if (field === 'email') setNotice('')
  }
  const handleFailure = (reason: unknown, codeRequest = false) => {
    setError(errorMessage(reason))
    if (reason instanceof ApiError && reason.status === 429)
      (codeRequest ? sendCooldown : submitCooldown).start(
        reason.retryAfter ?? 60,
      )
    if (
      codeRequest &&
      reason instanceof ApiError &&
      reason.code === 'MAIL_UNAVAILABLE'
    )
      sendCooldown.start(60)
  }
  const sendCode = async () => {
    if (sendPending.current || savePending.current || sendCooldown.seconds > 0)
      return
    const emailError = validateEmail(values.email)
    setErrors((current) => ({ ...current, email: emailError }))
    if (emailError) return
    sendPending.current = true
    setSending(true)
    setError('')
    setNotice('')
    try {
      await authApi.emailCode({
        email: values.email,
        purpose: registering ? 'REGISTER' : 'RESET_PASSWORD',
      })
      setNotice(
        '如可处理，验证码将发送至该邮箱，请查收；验证码 10 分钟内有效。',
      )
      sendCooldown.start(60)
    } catch (reason) {
      handleFailure(reason, true)
    } finally {
      sendPending.current = false
      setSending(false)
    }
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (
      savePending.current ||
      sendPending.current ||
      submitCooldown.seconds > 0
    )
      return
    const nextErrors: Partial<Record<Field, string>> = {}
    const emailError = validateEmail(values.email)
    const passwordError = validatePassword(values.password)
    if (emailError) nextErrors.email = emailError
    if (passwordError) nextErrors.password = passwordError
    if (!/^[0-9]{6}$/.test(values.verificationCode))
      nextErrors.verificationCode = '请输入邮件中的 6 位数字验证码'
    if (values.confirmation !== values.password)
      nextErrors.confirmation = '两次输入的密码不一致'
    if (registering && values.nickname.length > 30)
      nextErrors.nickname = '昵称最多 30 个字符'
    if (registering && /[@\x00-\x1f\x7f]/.test(values.nickname))
      nextErrors.nickname = '昵称不能包含 @ 或控制字符'
    setErrors(nextErrors)
    setError('')
    if (Object.keys(nextErrors).length) return
    savePending.current = true
    setSaving(true)
    try {
      if (registering) {
        await authApi.register({
          email: values.email,
          password: values.password,
          verificationCode: values.verificationCode,
          nickname: values.nickname,
        })
        void navigate('/login', {
          replace: true,
          state: {
            loginMode: 'email',
            authNotice: values.nickname.trim()
              ? '注册成功，可使用邮箱或刚填写的昵称和密码登录。'
              : '注册成功，请使用邮箱和密码登录。',
          },
        })
      } else {
        await authApi.resetPassword({
          email: values.email,
          newPassword: values.password,
          verificationCode: values.verificationCode,
        })
        await clearSession()
        void navigate('/login', {
          replace: true,
          state: {
            loginMode: 'email',
            authNotice: '密码已重置，旧会话已失效，请重新登录。',
          },
        })
      }
    } catch (reason) {
      handleFailure(reason)
    } finally {
      savePending.current = false
      setSaving(false)
    }
  }
  return (
    <form
      className="fg-login-form"
      noValidate
      onSubmit={(event) => void submit(event)}
      aria-label={registering ? '邮箱注册' : '重置密码'}
    >
      <fieldset disabled={saving}>
        <legend className="sr-only">
          {registering ? '注册信息' : '密码重置信息'}
        </legend>
        <AuthTextField
          id="auth-email"
          disabled={sending}
          label="邮箱"
          icon={Mail}
          type="email"
          autoComplete="email"
          maxLength={254}
          placeholder="请输入邮箱"
          value={values.email}
          onChange={(event) => change('email', event.target.value)}
          error={errors.email}
          required
        />
        <AuthTextField
          id="auth-code"
          label="邮箱验证码"
          icon={KeyRound}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="6 位数字验证码"
          value={values.verificationCode}
          onChange={(event) =>
            change(
              'verificationCode',
              event.target.value.replace(/[^0-9]/g, ''),
            )
          }
          error={errors.verificationCode}
          fieldClassName="fg-auth-code-field"
          required
          suffix={
            <Button
              type="button"
              variant="ghost"
              className="fg-auth-code-button"
              disabled={sending || saving || sendCooldown.seconds > 0}
              onClick={() => void sendCode()}
            >
              {sending
                ? '发送中…'
                : sendCooldown.seconds > 0
                  ? `${sendCooldown.seconds} 秒后重发`
                  : '获取验证码'}
            </Button>
          }
        />
        {registering && (
          <AuthTextField
            id="auth-nickname"
            label="用户名"
            icon={UserRound}
            autoComplete="nickname"
            maxLength={30}
            placeholder="请输入用户名"
            value={values.nickname}
            onChange={(event) => change('nickname', event.target.value)}
            error={errors.nickname}
          />
        )}
        <AuthPasswordField
          id="auth-password"
          label={registering ? '密码' : '新密码'}
          autoComplete="new-password"
          placeholder="请输入密码"
          value={values.password}
          onChange={(event) => change('password', event.target.value)}
          error={errors.password}
          required
        />
        <AuthPasswordField
          id="auth-confirmation"
          label="确认密码"
          autoComplete="new-password"
          placeholder="再次输入密码"
          value={values.confirmation}
          onChange={(event) => change('confirmation', event.target.value)}
          error={errors.confirmation}
          required
        />
        <Button
          type="submit"
          className="fg-login-submit"
          disabled={saving || sending || submitCooldown.seconds > 0}
        >
          {saving && <LoaderCircle size={18} className="animate-spin" />}
          {saving
            ? '提交中…'
            : submitCooldown.seconds > 0
              ? `${submitCooldown.seconds} 秒后重试`
              : registering
                ? '创建账号'
                : '重置密码'}
        </Button>
      </fieldset>
      {notice && (
        <p className="fg-auth-success" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="fg-login-submit-error" role="alert">
          {error}
        </p>
      )}
      <p className="fg-login-register">
        <Link className="fg-auth-text-link" to="/login">
          返回登录
        </Link>
      </p>
    </form>
  )
}
