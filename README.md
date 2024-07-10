#### Установка:

```
npm install simple-mui-redux-form
```

<details>
<summary>
  
#### TextInput - компонент-обертка над mui TextField</summary>

По сравнению с TextField имеет 3 дополнительных свойства, и еще 3 свойства получает от компонента высшего порядка WithErrorHandling (см. ниже)
```typescript
import { TextFieldProps } from "@mui/material"

type TextInputProps = TextFieldProps & {
  inputField: InputField;
  needHelperText?: boolean;
  onchange: (value: string, error: string) => void;
};
  ```
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

#### Что еще есть в пакете:
<details><summary>InputField</summary>
  
```typescript
type InputField = {
  value: string;
  error: string;
  unTouched: boolean;
};
  ```
</details>

<details><summary>InputPayload</summary>
  
```typescript
type InputPayload = Omit<InputField, "unTouched">;
  ```
</details>

<details><summary>FormState</summary>
  
```typescript
// N - объединение (union) имён полей формы
type FormState<N extends string> = {
  [key in N]: InputField;
};
  ```
</details>

<details><summary>FormPayload</summary>
  
```typescript
// N - объединение (union) имён полей формы
type FormPayload<N extends string> = {
  [key in N]: string;
};
  ```
</details>

<details><summary>useForm</summary>
  Возвращает formPayload и обработчик ввода текста в TextInput
  
```typescript
// N - объединение (union) имён полей формы
const useForm = <N extends string>(
  inputFields: FormState<N>,
  reducer: ActionCreatorWithPreparedPayload<
    [N, string, string],
    WithInputField<N>
  >
) => {
  const dispatch = useDispatch();
  const formPayload = createFormPayload(inputFields);

  const handleChange = (name: N) => {
    return (value: string, error: string) => {
      dispatch(reducer(name, value, error));
    };
  };
  return { formPayload, handleChange };
};
  ```
</details>

<details><summary>WithInputField</summary>
  
```typescript
// N - объединение (union) имён полей формы
type WithInputField<N> = {
  inputPayload: InputPayload;
  name: N;
};
  ```
</details>  

<details><summary>checkDiapason</summary>
  
```typescript
const checkDiapason: InputValidator = (
  inputed: string,
  options: ValidateOptions
) => {
  const value = Number(inputed);
  if (isNaN(value)) return false;
  let correct = true;
  const { max, min, moreThan, lessThan } = options;
  if (typeof max === "number") correct = value <= max;
  if (typeof min === "number" && correct) correct = value >= min;
  if (typeof moreThan === "number" && correct) correct = value > moreThan;
  if (typeof lessThan === "number" && correct) correct = value < lessThan;
  return correct;
};
  ```
</details>

 <details><summary>checkLength</summary>
  
```typescript
const checkLength: InputValidator = (
  inputed: string,
  options: ValidateOptions
) => {
  let correct = true;
  const { maxLength, minLength } = options;
  if (typeof minLength === "number") correct = inputed.length >= minLength;
  if (typeof maxLength === "number") correct = inputed.length <= maxLength;
  return correct;
};
  ```
</details>

<details>
  <summary>checkNotEmpty</summary>
  
```typescript
const checkNotEmpty: InputValidator = (inputed: string) =>
  checkLength(inputed, { minLength: 1 });
  ```
</details>
  <details>
    <summary>notEmpty</summary>
  
```typescript
const notEmpty: ValidateHelper = {
  validate: checkNotEmpty,
  error_text: "Поле не должно быть пустым",
};
  ```
</details>
  <details>
    <summary>defaultInputField</summary>
  
```typescript
const defaulInputField: InputField = {
  error: "",
  value: "",
  unTouched: true,
};
  ```
</details>  

