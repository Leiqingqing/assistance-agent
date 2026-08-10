import type { ComponentProps, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Label } from "./label";
import { Separator } from "./separator";
import { cn } from "../../utils";

export function FieldSet({
  className,
  ...props
}: ComponentProps<"fieldset">) {
  return (
    <fieldset
      {...props}
      data-slot="field-set"
      className={cn(
        "flex min-w-0 flex-col gap-6 disabled:cursor-not-allowed disabled:opacity-70",
        className,
      )}
    />
  );
}

const fieldLegendVariants = cva(
  "font-medium text-foreground group-data-[invalid=true]/field:text-destructive",
  {
    variants: {
      variant: {
        legend: "text-body-lg",
        label: "text-body",
      },
    },
    defaultVariants: {
      variant: "legend",
    },
  },
);

export function FieldLegend({
  className,
  variant,
  ...props
}: ComponentProps<"legend"> & VariantProps<typeof fieldLegendVariants>) {
  return (
    <legend
      {...props}
      data-slot="field-legend"
      data-variant={variant ?? "legend"}
      className={cn(fieldLegendVariants({ variant }), className)}
    />
  );
}

export function FieldGroup({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="field-group"
      className={cn(
        "@container/field-group flex w-full flex-col gap-7",
        className,
      )}
    />
  );
}

const fieldVariants = cva(
  "group/field flex w-full min-w-0 gap-3 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-70 data-[invalid=true]:text-destructive has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-70 has-[[aria-invalid=true]]:text-destructive",
  {
    variants: {
      orientation: {
        vertical: "flex-col [&>*]:w-full [&>.sr-only]:w-auto",
        horizontal:
          "flex-row items-center [&>[data-slot=field-label]]:flex-auto has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox]]:mt-1 has-[>[data-slot=field-content]]:[&>[role=radio]]:mt-1 has-[>[data-slot=field-content]]:[&>[type=checkbox]]:mt-1 has-[>[data-slot=field-content]]:[&>[type=radio]]:mt-1",
        responsive:
          "flex-col [&>*]:w-full [&>.sr-only]:w-auto @md/field-group:flex-row @md/field-group:items-center @md/field-group:[&>*]:w-auto @md/field-group:[&>[data-slot=field-label]]:flex-auto @md/field-group:has-[>[data-slot=field-content]]:items-start",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  },
);

export function Field({
  className,
  orientation,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      {...props}
      data-slot="field"
      data-orientation={orientation ?? "vertical"}
      className={cn(fieldVariants({ orientation }), className)}
    />
  );
}

export function FieldContent({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="field-content"
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-1.5 leading-snug",
        className,
      )}
    />
  );
}

export function FieldLabel({
  className,
  ...props
}: ComponentProps<typeof Label>) {
  return (
    <Label
      {...props}
      data-slot="field-label"
      className={cn(
        "group/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:pointer-events-none group-data-[disabled=true]/field:opacity-50 group-data-[invalid=true]/field:text-destructive has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[[aria-invalid=true]]:text-destructive has-[input[type=checkbox]]:items-start has-[input[type=radio]]:items-start has-[[role=checkbox]]:items-start has-[[role=radio]]:items-start has-[[data-slot=checkbox]]:items-start has-[[data-slot=radio-group-item]]:items-start",
        className,
      )}
    />
  );
}

export function FieldTitle({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="field-title"
      className={cn("text-body font-medium leading-snug", className)}
    />
  );
}

export function FieldDescription({
  className,
  ...props
}: ComponentProps<"p">) {
  return (
    <p
      {...props}
      data-slot="field-description"
      className={cn(
        "text-body leading-normal text-muted-foreground group-data-[invalid=true]/field:text-destructive/90",
        className,
      )}
    />
  );
}

export function FieldSeparator({
  children,
  className,
  ...props
}: ComponentProps<"div">) {
  const hasContent =
    children !== undefined &&
    children !== null &&
    children !== false &&
    children !== "";

  return (
    <div
      {...props}
      data-slot="field-separator"
      data-content={hasContent}
      className={cn(
        "relative -my-2 h-5 text-body text-muted-foreground",
        className,
      )}
    >
      <Separator className="absolute inset-x-0 top-1/2" />
      {hasContent && (
        <span
          data-slot="field-separator-content"
          className="relative mx-auto block w-fit bg-background px-2"
        >
          {children}
        </span>
      )}
    </div>
  );
}

type FieldErrorProps = ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>;
};

export function FieldError({
  children,
  className,
  errors,
  ...props
}: FieldErrorProps) {
  const messages = Array.from(
    new Set(
      errors
        ?.map((error) => error?.message)
        .filter((message): message is string => Boolean(message)),
    ),
  );
  const hasChildren =
    children !== undefined &&
    children !== null &&
    children !== false &&
    children !== "";
  const content: ReactNode =
    (hasChildren ? children : null) ??
    (messages.length === 1 ? (
      messages[0]
    ) : messages.length > 1 ? (
      <ul className="ml-4 list-disc space-y-1">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    ) : null);

  if (content == null) {
    return null;
  }

  return (
    <div
      {...props}
      role="alert"
      data-slot="field-error"
      className={cn("text-body text-destructive", className)}
    >
      {content}
    </div>
  );
}
