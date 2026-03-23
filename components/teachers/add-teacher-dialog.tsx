'use client'

import { useState, useEffect } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
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
  FieldDescription,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, User, Phone, Mail, GraduationCap, FileText, Loader2 } from 'lucide-react'
import { createTeacher, updateTeacher } from '@/app/actions/teachers'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const FormSchema = z.object({
  first_name: z.string().min(1, 'First name is required.'),
  last_name: z.string().min(1, 'Last name is required.'),
  cnic: z.string().min(1, 'CNIC is required.'),
  email: z.string().email('Invalid email').min(1, 'Required'),
  phone: z.string().min(1, 'Phone is required.'),
  whatsapp_no: z.string().optional().or(z.literal('')),
  age: z.coerce.number().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  specialization: z.string().optional().or(z.literal('')),
  salary_type: z.enum(['salary', 'commission']).default('salary'),
  commission_type: z.enum(['per_class', 'per_student']).optional(),
  commission_rate: z.coerce.number().default(0),
})

type FormValues = z.infer<typeof FormSchema>

interface AddTeacherDialogProps {
  trigger?: React.ReactNode
  teacher?: any
}

export function AddTeacherDialog({ trigger, teacher }: AddTeacherDialogProps) {
  const [open, setOpen] = useState(false)
  const isEdit = !!teacher
  const queryClient = useQueryClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema) as any,
    defaultValues: {
      first_name: teacher?.first_name || '',
      last_name: teacher?.last_name || '',
      cnic: teacher?.cnic || '',
      email: teacher?.email || '',
      phone: teacher?.phone || '',
      whatsapp_no: teacher?.whatsapp_no || '',
      age: teacher?.age || '' as any,
      address: teacher?.address || '',
      specialization: teacher?.specialization || '',
      salary_type: teacher?.salary_type || 'salary',
      commission_type: teacher?.commission_type || 'per_student',
      commission_rate: teacher?.commission_rate || 0,
    },
  })

  // Reset form when teacher prop changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        first_name: teacher?.first_name || '',
        last_name: teacher?.last_name || '',
        cnic: teacher?.cnic || '',
        email: teacher?.email || '',
        phone: teacher?.phone || '',
        whatsapp_no: teacher?.whatsapp_no || '',
        age: teacher?.age || '' as any,
        address: teacher?.address || '',
        specialization: teacher?.specialization || '',
        salary_type: teacher?.salary_type || 'salary',
        commission_type: teacher?.commission_type || 'per_student',
        commission_rate: teacher?.commission_rate || 0,
      })
    }
  }, [teacher, open, form])

  const salaryType = form.watch('salary_type')

  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(data: FormValues) {
    setIsLoading(true)
    try {
      const res = isEdit
        ? await updateTeacher((teacher as any).id, data)
        : await createTeacher(data)

      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success(isEdit ? 'Teacher updated successfully' : 'Teacher added successfully')
      setOpen(false)
      if (!isEdit) form.reset()
      queryClient.invalidateQueries({ queryKey: ['teachers-list'] })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 shadow-sm">
            <Plus className="size-4" />
            Add Teacher
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl border-none shadow-2xl bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Teacher Details' : 'Add New Teacher'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Update profile information for ${teacher.first_name} ${teacher.last_name}.`
              : 'Create a staff account with automated portal access.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...(form as any)}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4 pt-4">
            <AnimatePresence>
              {open && (
                <FieldGroup className="flex flex-col gap-4">
                  {/* Row 1: First Name + Last Name */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <FormField
                      name="first_name"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={!!fieldState.error}>
                          <FieldLabel>First Name *</FieldLabel>
                          <InputGroup>
                            <InputGroupAddon><User className="size-4" /></InputGroupAddon>
                            <InputGroupInput placeholder="First Name" {...field} />
                          </InputGroup>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                    <FormField
                      name="last_name"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={!!fieldState.error}>
                          <FieldLabel>Last Name *</FieldLabel>
                          <InputGroup>
                            <InputGroupAddon><User className="size-4" /></InputGroupAddon>
                            <InputGroupInput placeholder="Last Name" {...field} />
                          </InputGroup>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                  </motion.div>

                  {/* Row 2: Email + Phone */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <FormField
                      name="email"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={!!fieldState.error}>
                          <FieldLabel>Email *</FieldLabel>
                          <InputGroup>
                            <InputGroupAddon><Mail className="size-4" /></InputGroupAddon>
                            <InputGroupInput placeholder="teacher@example.com" {...field} />
                          </InputGroup>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                    <FormField
                      name="phone"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={!!fieldState.error}>
                          <FieldLabel>Contact No *</FieldLabel>
                          <InputGroup>
                            <InputGroupAddon><Phone className="size-4" /></InputGroupAddon>
                            <InputGroupInput placeholder="03xx-xxxxxxx" {...field} />
                          </InputGroup>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                  </motion.div>

                  {/* Row 3: WhatsApp + CNIC */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <FormField
                      name="whatsapp_no"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={!!fieldState.error}>
                          <FieldLabel>WhatsApp Number</FieldLabel>
                          <InputGroup>
                            <InputGroupAddon><Phone className="size-4" /></InputGroupAddon>
                            <InputGroupInput placeholder="Optional" {...field} />
                          </InputGroup>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                    <FormField
                      name="cnic"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={!!fieldState.error}>
                          <FieldLabel>CNIC *</FieldLabel>
                          <InputGroup>
                            <InputGroupAddon><User className="size-4" /></InputGroupAddon>
                            <InputGroupInput placeholder="xxxxx-xxxxxxx-x" {...field} />
                          </InputGroup>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                  </motion.div>

                  {/* Row 4: Age + Address */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <FormField
                      name="age"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={!!fieldState.error}>
                          <FieldLabel>Age</FieldLabel>
                          <InputGroup>
                            <InputGroupInput type="number" placeholder="Years" {...field} />
                          </InputGroup>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                    <FormField
                      name="address"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={!!fieldState.error}>
                          <FieldLabel>Address</FieldLabel>
                          <InputGroup>
                            <InputGroupInput placeholder="Residence" {...field} />
                          </InputGroup>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                  </motion.div>

                  {/* Row 5: Salary Type + Commission Type */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <FormField
                      name="salary_type"
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Salary Type</FieldLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="salary">Fixed Salary</SelectItem>
                              <SelectItem value="commission">Commission Based</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                      )}
                    />
                    {salaryType === 'commission' && (
                      <FormField
                        name="commission_type"
                        render={({ field }) => (
                          <Field>
                            <FieldLabel>Commission Type</FieldLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select logic" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="per_student">Per Student</SelectItem>
                                <SelectItem value="per_class">Per Class</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                        )}
                      />
                    )}
                  </motion.div>

                  {/* Row 6: Commission Rate (conditional, full width) */}
                  {salaryType === 'commission' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                      <FormField
                        name="commission_rate"
                        render={({ field, fieldState }) => (
                          <Field data-invalid={!!fieldState.error}>
                            <FieldLabel>Commission Percentage (%)</FieldLabel>
                            <InputGroup>
                              <InputGroupInput type="number" placeholder="Percentage" {...field} />
                            </InputGroup>
                            <FieldError errors={[fieldState.error]} />
                          </Field>
                        )}
                      />
                    </motion.div>
                  )}

                  {/* Row 7: Specialization + Docs */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <FormField
                      name="specialization"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={!!fieldState.error}>
                          <FieldLabel>Specialization</FieldLabel>
                          <InputGroup>
                            <InputGroupAddon><GraduationCap className="size-4" /></InputGroupAddon>
                            <InputGroupInput placeholder="e.g. Mathematics, Physics" {...field} />
                          </InputGroup>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                    <Field>
                      <FieldLabel>Related Docs (CV, Certificates)</FieldLabel>
                      <InputGroup>
                        <InputGroupAddon><FileText className="size-4" /></InputGroupAddon>
                        <InputGroupInput type="file" className="cursor-pointer" multiple />
                      </InputGroup>
                      <FieldDescription>Upload teacher credentials.</FieldDescription>
                    </Field>
                  </motion.div>
                </FieldGroup>
              )}
            </AnimatePresence>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEdit ? 'Saving...' : 'Adding...'}
                  </>
                ) : (
                  isEdit ? 'Save Changes' : 'Add Teacher'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
