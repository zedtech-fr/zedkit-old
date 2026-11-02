"use client";

import { useState } from "react";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormSubmit,
  Input,
  Text,
  useValidatedForm,
} from "@zedtech/zedkit-ui";
import { validatedFormCopy } from "@/components/demos/i18n/validated-form-copy";

const schema = z.object({ name: z.string().min(2, validatedFormCopy.nameMin) });

export function ValidatedFormDemo() {
  const [saved, setSaved] = useState<string | null>(null);
  const form = useValidatedForm(schema, { defaultValues: { name: "" } });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => setSaved(values.name))}
        className="max-w-sm space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{validatedFormCopy.label}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>{validatedFormCopy.description}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormSubmit pendingLabel={validatedFormCopy.pending}>{validatedFormCopy.save}</FormSubmit>
        {saved ? <Text variant="muted">{validatedFormCopy.saved(saved)}</Text> : null}
      </form>
    </Form>
  );
}
