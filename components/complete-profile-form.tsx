'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { completeProfile } from '@/app/actions/profile'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { RippleButton } from '@/components/ui/ripple-button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { LogoUpload } from '@/components/ui/logo-upload'

const profileSchema = z.object({
  academy_name: z.string().min(2, 'Academy name must be at least 2 characters.'),
  academy_contact: z.string().min(5, 'Contact information is required.'),
  location: z.string().min(2, 'Location is required.'),
  website: z.string().url('Must be a valid URL.').optional().or(z.literal('')),
  description: z.string().optional(),
  academy_logo: z.any().optional(),
})

type ProfileValues = z.infer<typeof profileSchema>

export function CompleteProfileForm({ open }: { open: boolean }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      academy_name: '',
      academy_contact: '',
      location: '',
      website: '',
      description: '',
      academy_logo: null,
    },
  })

  async function onSubmit(values: ProfileValues) {
    setIsSubmitting(true)
    const formData = new FormData()
    formData.append('academy_name', values.academy_name)
    formData.append('academy_contact', values.academy_contact)
    formData.append('location', values.location)
    if (values.website) formData.append('website', values.website)
    if (values.description) formData.append('description', values.description)
    if (values.academy_logo instanceof File) {
      formData.append('academy_logo', values.academy_logo)
    }

    const result = await completeProfile(formData)
    if (result.error) {
      toast.error(result.error)
      setIsSubmitting(false)
    } else {
      toast.success('Profile completed successfully!')
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[640px]"
        showCloseButton={false}
      >
        {/* Fixed Header */}
        <div className="flex-none px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Complete Your Academy Profile
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Set up your academy to unlock your dashboard. This only takes a minute.
            </DialogDescription>
          </DialogHeader>
        </div>

        <Separator />

        {/* Scrollable Form Body */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* — Logo section — */}
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/30 py-6 px-4">
                <FormField
                  control={form.control}
                  name="academy_logo"
                  render={({ field }: { field: any }) => (
                    <FormItem className="flex flex-col items-center gap-1 w-full">
                      <FormControl>
                        <LogoUpload
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <p className="text-xs font-medium text-muted-foreground">
                        Academy Logo
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* — Section: General — */}
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  General Information
                </p>
                <Separator className="mb-3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="academy_name"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>
                          Academy Name <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Pinnacle Sports Academy" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>
                          Location <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Dubai, UAE" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* — Section: Contact — */}
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Contact & Online Presence
                </p>
                <Separator className="mb-3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="academy_contact"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>
                          Phone / Email <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. +971 50 123 4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://youracademy.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* — Section: About — */}
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  About the Academy
                </p>
                <Separator className="mb-3" />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Share what makes your academy unique — your programs, coaching philosophy, achievements..."
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Fixed Footer */}
            <Separator />
            <div className="flex-none flex items-center justify-between px-6 py-4">
              <p className="text-xs text-muted-foreground">
                Fields marked <span className="text-destructive font-medium">*</span> are required
              </p>
              <RippleButton
                type="submit"
                className="min-w-[140px] h-10 bg-primary text-primary-foreground border-primary text-sm font-medium px-6"
                disabled={isSubmitting}
                rippleColor="hsl(var(--primary-foreground) / 0.4)"
              >
                {isSubmitting ? 'Saving…' : 'Save & Continue'}
              </RippleButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
