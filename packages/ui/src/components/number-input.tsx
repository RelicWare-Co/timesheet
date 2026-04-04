import * as React from "react";

import { Input } from "@timesheet/ui/components/input";

type NumberInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "defaultValue" | "onChange" | "type" | "value"
> & {
  onValueChange: (value: number) => void;
  value: number;
};

function NumberInput({
  onBlur,
  onFocus,
  onValueChange,
  value,
  ...props
}: NumberInputProps) {
  const [displayValue, setDisplayValue] = React.useState(String(value));
  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue(String(value));
    }
  }, [isFocused, value]);

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    event.currentTarget.select();
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setDisplayValue(String(value));

    onBlur?.(event);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setDisplayValue(nextValue);

    if (nextValue.trim() === "") {
      return;
    }

    const parsedValue = Number(nextValue);
    if (Number.isNaN(parsedValue)) {
      return;
    }

    onValueChange(parsedValue);
  };

  return (
    <Input
      {...props}
      type="number"
      value={displayValue}
      onBlur={handleBlur}
      onChange={handleChange}
      onFocus={handleFocus}
    />
  );
}

export { NumberInput };
