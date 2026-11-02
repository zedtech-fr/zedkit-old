"use client";

import * as React from "react";
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Input,
  Stack,
  Text,
  Textarea,
} from "@zedtech/zedkit-ui";
import { fieldCopy } from "@/components/demos/i18n/field-copy";

export function FieldDemo() {
  const [name, setName] = React.useState<string>(fieldCopy.initialName);
  const [summary, setSummary] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [created, setCreated] = React.useState(false);
  const tooShort = name.trim().length < 3;
  const showError = submitted && tooShort;

  return (
    <form
      noValidate
      className="min-w-0"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        setCreated(!tooShort);
      }}
    >
      <FieldSet>
        <FieldLegend>{fieldCopy.legend}</FieldLegend>
        <FieldGroup>
          <Field data-invalid={showError}>
            <FieldLabel htmlFor="field-project-name">{fieldCopy.projectNameLabel}</FieldLabel>
            <Input
              id="field-project-name"
              value={name}
              aria-invalid={showError}
              aria-describedby="field-project-name-help"
              onChange={(event) => {
                setName(event.target.value);
                setCreated(false);
              }}
            />
            <FieldDescription id="field-project-name-help">{fieldCopy.projectNameHelp}</FieldDescription>
            {showError ? <FieldError errors={[{ message: fieldCopy.nameTooShort }]} /> : null}
          </Field>
          <Field>
            <FieldLabel htmlFor="field-project-summary">{fieldCopy.summaryLabel}</FieldLabel>
            <Textarea
              id="field-project-summary"
              value={summary}
              placeholder={fieldCopy.summaryPlaceholder}
              onChange={(event) => setSummary(event.target.value)}
            />
          </Field>
        </FieldGroup>
        <Stack direction="horizontal" gap={3} className="items-center">
          <Button type="submit">{fieldCopy.submit}</Button>
          {created ? (
            <Text role="status" variant="muted">
              {fieldCopy.created(name.trim())}
            </Text>
          ) : null}
        </Stack>
      </FieldSet>
    </form>
  );
}
