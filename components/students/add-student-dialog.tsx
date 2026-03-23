'use client'

import { useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
} from '@/components/ui/form'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Plus, User, Phone, Mail, Calendar, MapPin } from 'lucide-react'
import { createStudent } from '@/app/actions/students'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

const FormSchema = z.object({
  full_name: z.string().min(1, 'Required').max(100),
  date_of_birth: z.string().optional(),
  parent_name: z.string().min(1, 'Required').max(100),
  parent_phone: z.string().min(1, 'Required').max(20),
  parent_email: z.string().email().optional().or(z.literal('')),
  address: z.string().max(200).optional(),
  enrollment_date: z.string().min(1, 'Required'),
  notes: z.string().max(500).optional(),
})

interface AddStudentDialogProps {
  trigger?: React.ReactNode
}

export function AddStudentDialog({ trigger }: AddStudentDialogProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      full_name: '',
      date_of_birth: '',
      parent_name: '',
      parent_phone: '',
      parent_email: '',
      address: '',
      enrollment_date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    },
  })

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    const res = await createStudent(data)
    if (res?.error) {
      toast.error(res.error)
      return
    }
    toast.success('Enrolled successfully')
    setOpen(false)
    form.reset()
    queryClient.invalidateQueries({ queryKey: ['students-list'] })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 shadow-sm">
            <Plus className="size-4" />
            Add Student
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl border-none shadow-2xl bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>New Student Enrollment</DialogTitle>
          <DialogDescription>Enter basic details to register a new student.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <AnimatePresence>
              {open && (
                <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="contents"
                  >
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={!!fieldState.error}>
                          <FieldLabel>Full Name *</FieldLabel>
                          <InputGroup>
                            <InputGroupAddon>
                              <User className="size-4" />
                            </InputGroupAddon>
                            <InputGroupInput placeholder="Full Name" {...field} />
                          </InputGroup>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="date_of_birth"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={!!fieldState.error}>
                          <FieldLabel>Date of Birth</FieldLabel>
                          <InputGroup>
                            <InputGroupAddon>
                              <Calendar className="size-4" />
                            </InputGroupAddon>
                            <InputGroupInput type="date" {...field} />
                          </InputGroup>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="contents"
                  >
                    <FormField
                      control={form.control}
                      name="parent_name"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={!!fieldState.error}>
                          <FieldLabel>Parent Name *</FieldLabel>
                          <InputGroup>
                            <InputGroupInput placeholder="Guardian Name" {...field} />
                          </InputGroup>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="parent_phone"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={!!fieldState.error}>
                          <FieldLabel>Parent Phone *</FieldLabel>
                          <InputGroup>
                            <InputGroupAddon>
                              <Phone className="size-4" />
                            </InputGroupAddon>
                            <InputGroupInput placeholder="Phone Number" {...field} />
                          </InputGroup>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="contents"
                  >
                    <FormField
                      control={form.control}
                      name="parent_email"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={!!fieldState.error}>
                          <FieldLabel>Parent Email</FieldLabel>
                          <InputGroup>
                            <InputGroupAddon>
                              <Mail className="size-4" />
                            </InputGroupAddon>
                            <InputGroupInput placeholder="Email Address" {...field} />
                          </InputGroup>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="enrollment_date"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={!!fieldState.error}>
                          <FieldLabel>Enrollment Date *</FieldLabel>
                          <InputGroup>
                            <InputGroupInput type="date" {...field} />
                          </InputGroup>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="contents"
                  >
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field, fieldState }) => (
                        <Field className="col-span-full" data-invalid={!!fieldState.error}>
                          <FieldLabel>Address</FieldLabel>
                          <InputGroup>
                            <InputGroupAddon>
                              <MapPin className="size-4" />
                            </InputGroupAddon>
                            <InputGroupInput placeholder="Home Address" {...field} />
                          </InputGroup>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field, fieldState }) => (
                        <Field className="col-span-full" data-invalid={!!fieldState.error}>
                          <FieldLabel>Notes</FieldLabel>
                          <FormControl>
                            <Textarea placeholder="Additional information..." className="min-h-[80px]" {...field} />
                          </FormControl>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                  </motion.div>
                </FieldGroup>
              )}
            </AnimatePresence>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Enroll Student'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
