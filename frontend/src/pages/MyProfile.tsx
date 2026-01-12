import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { authApi } from '@/api/auth'
import { updateUserName, updateUserEmail } from '@/store/slices/authSlice'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toast } from 'react-toastify'
import { User, Mail, Edit2 } from 'lucide-react'

const nameSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50, 'First name must be at most 50 characters'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name must be at most 50 characters'),
})

type NameFormValues = z.infer<typeof nameSchema>

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
})

type OtpFormValues = z.infer<typeof otpSchema>

const newEmailSchema = z.object({
  new_email: z.string().email('Invalid email address'),
})

type NewEmailFormValues = z.infer<typeof newEmailSchema>

const newEmailOtpSchema = z.object({
  new_email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
})

type NewEmailOtpFormValues = z.infer<typeof newEmailOtpSchema>

type EmailChangeStep = 1 | 2 | 3 | 4 | null

const MyProfile = () => {
  const dispatch = useDispatch()
  const userName = useSelector((state: RootState) => state.auth.name)
  const userEmail = useSelector((state: RootState) => state.auth.email)

  // Parse name from "First Last" format
  const parseName = (name: string | null): { first_name: string; last_name: string } => {
    if (!name) return { first_name: '', last_name: '' }
    const parts = name.trim().split(/\s+/)
    if (parts.length === 0) return { first_name: '', last_name: '' }
    if (parts.length === 1) return { first_name: parts[0], last_name: '' }
    const last_name = parts.pop() || ''
    const first_name = parts.join(' ')
    return { first_name, last_name }
  }

  const parsedName = parseName(userName)

  // Name update form
  const nameForm = useForm<NameFormValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: {
      first_name: parsedName.first_name,
      last_name: parsedName.last_name,
    },
  })

  // Update form when userName changes
  useEffect(() => {
    const parsed = parseName(userName)
    nameForm.reset({
      first_name: parsed.first_name,
      last_name: parsed.last_name,
    })
  }, [userName])

  const [isUpdatingName, setIsUpdatingName] = useState(false)

  const onNameSubmit = async (data: NameFormValues) => {
    setIsUpdatingName(true)
    try {
      const response = await authApi.updateName(data)
      dispatch(updateUserName({ name: `${response.first_name} ${response.last_name}` }))
      toast.success('Name updated successfully')
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || 'Failed to update name'
      toast.error(errorMessage)
    } finally {
      setIsUpdatingName(false)
    }
  }

  // Email change flow state
  const [emailChangeStep, setEmailChangeStep] = useState<EmailChangeStep>(null)
  const [isRequestingEmailChange, setIsRequestingEmailChange] = useState(false)
  const [currentEmailForChange, setCurrentEmailForChange] = useState<string | null>(null)
  const [newEmailValue, setNewEmailValue] = useState<string>('')

  // Step 2: Current email OTP form
  const currentEmailOtpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  })

  // Step 3: New email form
  const newEmailForm = useForm<NewEmailFormValues>({
    resolver: zodResolver(newEmailSchema),
    defaultValues: {
      new_email: '',
    },
  })

  // Step 4: New email OTP form
  const newEmailOtpForm = useForm<NewEmailOtpFormValues>({
    resolver: zodResolver(newEmailOtpSchema),
    defaultValues: {
      new_email: '',
      otp: '',
    },
  })

  // Step 1: Request email change
  const handleRequestEmailChange = async () => {
    setIsRequestingEmailChange(true)
    try {
      const response = await authApi.requestEmailChange()
      setCurrentEmailForChange(response.email)
      setEmailChangeStep(2)
      toast.success('OTP sent to your current email address')
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || 'Failed to request email change'
      toast.error(errorMessage)
    } finally {
      setIsRequestingEmailChange(false)
    }
  }

  // Step 2: Verify current email OTP
  const [isVerifyingCurrentOtp, setIsVerifyingCurrentOtp] = useState(false)
  const onCurrentEmailOtpSubmit = async (data: OtpFormValues) => {
    setIsVerifyingCurrentOtp(true)
    try {
      await authApi.verifyEmailChangeOtp({ otp: data.otp })
      setEmailChangeStep(3)
      toast.success('OTP verified. Please enter your new email address.')
      currentEmailOtpForm.reset()
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || 'Invalid or expired OTP'
      toast.error(errorMessage)
      if (err.response?.status === 400) {
        // OTP expired or invalid, allow retry
      }
    } finally {
      setIsVerifyingCurrentOtp(false)
    }
  }

  // Step 3: Request new email
  const [isRequestingNewEmail, setIsRequestingNewEmail] = useState(false)
  const onNewEmailSubmit = async (data: NewEmailFormValues) => {
    if (data.new_email === userEmail) {
      toast.error('New email must be different from your current email')
      return
    }
    setIsRequestingNewEmail(true)
    try {
      await authApi.requestNewEmail({ new_email: data.new_email })
      setNewEmailValue(data.new_email)
      newEmailOtpForm.reset({ new_email: data.new_email, otp: '' })
      setEmailChangeStep(4)
      toast.success('OTP sent to your new email address')
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error('Eligibility expired. Please start the email change process again.')
        setEmailChangeStep(null)
        setCurrentEmailForChange(null)
      } else {
        const errorMessage = err.response?.data?.detail || err.response?.data?.message || 'Failed to request new email'
        toast.error(errorMessage)
      }
    } finally {
      setIsRequestingNewEmail(false)
    }
  }

  // Step 4: Verify new email OTP
  const [isVerifyingNewOtp, setIsVerifyingNewOtp] = useState(false)
  const onNewEmailOtpSubmit = async (data: NewEmailOtpFormValues) => {
    setIsVerifyingNewOtp(true)
    try {
      const response = await authApi.verifyNewEmailOtp({ new_email: data.new_email, otp: data.otp })
      dispatch(updateUserEmail({ email: response.email }))
      setEmailChangeStep(null)
      setCurrentEmailForChange(null)
      setNewEmailValue('')
      newEmailOtpForm.reset()
      toast.success('Email changed successfully! Please log in again with your new email address.')
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || 'Invalid or expired OTP'
      toast.error(errorMessage)
    } finally {
      setIsVerifyingNewOtp(false)
    }
  }

  // Ensure new_email is set in step 4 form
  useEffect(() => {
    if (emailChangeStep === 4 && newEmailValue) {
      newEmailOtpForm.reset({ new_email: newEmailValue, otp: '' })
    }
  }, [emailChangeStep, newEmailValue])

  // Close dialogs
  const closeEmailChangeDialog = () => {
    setEmailChangeStep(null)
    setCurrentEmailForChange(null)
    setNewEmailValue('')
    currentEmailOtpForm.reset()
    newEmailForm.reset()
    newEmailOtpForm.reset()
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      {/* Name Update Section */}
      <div className="bg-white dark:bg-card rounded-lg border p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Update Name</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
          <strong>Note:</strong> Your name will be used when creating custom resumes. Make sure it's accurate and up-to-date.
        </p>
        <Form {...nameForm}>
          <form onSubmit={nameForm.handleSubmit(onNameSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={nameForm.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={nameForm.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={isUpdatingName}>
              {isUpdatingName ? 'Updating...' : 'Update Name'}
            </Button>
          </form>
        </Form>
      </div>

      {/* Email Change Section */}
      <div className="bg-white dark:bg-card rounded-lg border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Email Address</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
          <strong>Note:</strong> Your email address will be used when creating custom resumes. Ensure it's correct and accessible.
        </p>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Current Email</p>
            <p className="text-base font-medium">{userEmail || 'No email'}</p>
          </div>
          <Button
            onClick={handleRequestEmailChange}
            disabled={isRequestingEmailChange}
            variant="outline"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            {isRequestingEmailChange ? 'Requesting...' : 'Change Email'}
          </Button>
        </div>
      </div>

      {/* Step 2 Dialog: Verify Current Email OTP */}
      <Dialog open={emailChangeStep === 2} onOpenChange={(open) => !open && closeEmailChangeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Current Email</DialogTitle>
            <DialogDescription>
              Step 2 of 4: Enter the OTP sent to {currentEmailForChange || userEmail}
            </DialogDescription>
          </DialogHeader>
          <Form {...currentEmailOtpForm}>
            <form onSubmit={currentEmailOtpForm.handleSubmit(onCurrentEmailOtpSubmit)} className="space-y-4">
              <FormField
                control={currentEmailOtpForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OTP</FormLabel>
                    <FormControl className='mt-2'>
                      <Input placeholder="Enter 6-digit OTP" maxLength={6} {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the 6-digit code sent to your current email address
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeEmailChangeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isVerifyingCurrentOtp}>
                  {isVerifyingCurrentOtp ? 'Verifying...' : 'Verify OTP'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Step 3 Dialog: Enter New Email */}
      <Dialog open={emailChangeStep === 3} onOpenChange={(open) => !open && closeEmailChangeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter New Email</DialogTitle>
            <DialogDescription>
              Step 3 of 4: Enter your new email address. You have 30 minutes to complete this process.
            </DialogDescription>
          </DialogHeader>
          <Form {...newEmailForm}>
            <form onSubmit={newEmailForm.handleSubmit(onNewEmailSubmit)} className="space-y-4">
              <FormField
                control={newEmailForm.control}
                name="new_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Email Address</FormLabel>
                    <FormControl className='mt-2'>
                      <Input type="email" placeholder="Enter new email address" {...field} />
                    </FormControl>
                    <FormDescription>
                      Make sure this email is different from your current email
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeEmailChangeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isRequestingNewEmail}>
                  {isRequestingNewEmail ? 'Sending...' : 'Send OTP to New Email'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Step 4 Dialog: Verify New Email OTP */}
      <Dialog open={emailChangeStep === 4} onOpenChange={(open) => !open && closeEmailChangeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify New Email</DialogTitle>
            <DialogDescription>
              Step 4 of 4: Enter the OTP sent to {newEmailValue || 'your new email address'}
            </DialogDescription>
          </DialogHeader>
          <Form {...newEmailOtpForm}>
            <form onSubmit={newEmailOtpForm.handleSubmit(onNewEmailOtpSubmit)} className="space-y-4">
              <FormField
                control={newEmailOtpForm.control}
                name="new_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Email Address</FormLabel>
                    <FormControl className='mt-2'>
                      <Input type="email" disabled {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newEmailOtpForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OTP</FormLabel>
                    <FormControl className='mt-2'>
                      <Input placeholder="Enter 6-digit OTP" maxLength={6} {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the 6-digit code sent to your new email address
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeEmailChangeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isVerifyingNewOtp}>
                  {isVerifyingNewOtp ? 'Verifying...' : 'Complete Email Change'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MyProfile
