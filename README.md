#### Установка:

```
npm install simple-mui-redux-form
```

<details>
<summary>
  
#### TextInput - компонент-обертка над mui TextField</summary>
  Производные от TextInput компоненты:
  
  PasswordInput

```typescript
type PasswordInputProps = Omit<
  TextInputProps,
  "InputProps" | "autoComplete" | "password"
>;

const PasswordInput: FC<PasswordInputProps & WithHandlingError> = (props) => {
  const { type, handleCLick, passwordVisibility } = useTextInput(true);
  return (
    <TextInput
      type={type}
      InputProps={{
        endAdornment: (
          <PasswordVisibilityButton
            onclick={handleCLick}
            show={passwordVisibility}
          />
        ),
      }}
      {...props}
    ></TextInput>
  );
};
```
  
  и NotEmptyTextInput

```typescript
const NotEmptyTextInput: FC<TextInputProps & WithHandlingError> = ({
  validateHelpers = [],
  ...props
}) => {
  return (
    <TextInput
      validateHelpers={[...validateHelpers, notEmpty]}
      {...props}
    ></TextInput>
  );
};
```
</details>

<details>
<summary>
  
#### WithErrorHandling (HOC)
</summary>

  добавляет в TextInput свойства для обработки пользовательского ввода:
```typescript
type WithErrorHandlingProps = {
  validateHelpers?: Array<ValidateHelper>;
  validateOptions?: ValidateOptions;
  mutators?: Array<InputMutator>;
};

export type ValidateHelper = {
  error_text: string;
  validate: InputValidator;
};

export type InputValidator = (
  inputed: string,
  options: ValidateOptions
) => boolean;

export type InputMutator = (inputed: string) => string;

export type ValidateOptions = {
  min?: number;
  max?: number;
  moreThan?: number;
  lessThan?: number;
  minLength?: number;
  maxLength?: number;
  maxAfterDot?: number;
};
```

Например, нужно задать минимальную длину вводимого текста 8 символов, в этом нам поможет функция-валидатор checkLength

```typescript
import {checkLength, TextInput} from 'simple-mui-redux-form'

const Min8CharsInput = () => {
  const validator = {validate: checkLength, error_text:'Минимум 8 символов'}
  return (
    <TextInput
      ...
      validateHelpers={[validator]}
      validateOptions={{minLength: 8}}
      ...
  />
)}
```

</details>

<details>
<summary>
  
#### createSliceOptions</summary>
  
  Облегчает создание слайса формы
  
```typescript
import { createSlice } from "@reduxjs/toolkit";
import {
  createSliceOptions,
  isFormValid,
  defaulInputField,
} from "simple-mui-redux-form";
import { RootState } from "..";

type LoginFormFieldName = "username" | "password"

const SignInSlice = createSlice(
  createSliceOptions<LoginFormFieldName>("login-form", {
    username: { ...defaulInputField },
    password: { ...defaulInputField },
  })
);

export const selectIsFormValid = (state: RootState): boolean =>
  isFormValid(state.loginFormState);

export const { setInitialValues, setInputField, setTouchedAll, resetForm } =
  SignInSlice.actions;
export default SignInSlice.reducer;
```
</details>
