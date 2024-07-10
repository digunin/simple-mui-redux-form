import React, { FC, useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  IconButton,
  InputAdornment,
  TextField,
  TextFieldProps,
  Tooltip,
} from "@mui/material";
import {
  ActionCreatorWithPreparedPayload,
  PayloadAction,
} from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";

// Types

type TextInputProps = TextFieldProps & {
  inputField: InputField;
  needHelperText?: boolean;
  onchange: (value: string, error: string) => void;
};

type PasswordInputProps = Omit<
  TextInputProps,
  "InputProps" | "autoComplete" | "password"
>;

type PVBProps = {
  show: boolean;
  onclick: () => void;
};

type WithHandlingError = {
  validateHelpers?: Array<ValidateHelper>;
  validateOptions?: ValidateOptions;
  mutators?: Array<InputMutator>;
};

type ValidateHelper = {
  error_text: string;
  validate: InputValidator;
};

type InputValidator = (inputed: string, options: ValidateOptions) => boolean;

type InputMutator = (inputed: string) => string;

type ValidateOptions = {
  min?: number;
  max?: number;
  moreThan?: number;
  lessThan?: number;
  minLength?: number;
  maxLength?: number;
  maxAfterDot?: number;
};

type InputField = {
  value: string;
  error: string;
  unTouched: boolean;
};

type InputPayload = Omit<InputField, "unTouched">;

type FormState<N extends string> = {
  [key in N]: InputField;
};

type WithInputField<N> = {
  inputPayload: InputPayload;
  name: N;
};

type FormPayload<N extends string> = {
  [key in N]: string;
};

// HOOKS

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

const createFormPayload = <N extends string>(inputFields: FormState<N>) => {
  const keys = Object.keys(inputFields);
  return keys.reduce((payload, key) => {
    const tmp = { [key]: inputFields[key as N].value };
    payload = { ...payload, ...tmp };
    return payload;
  }, {}) as FormPayload<N>;
};

const useTextInput = (password: boolean) => {
  const [passwordVisibility, setPasswordVisibility] = useState(false);
  const handleCLick = () => setPasswordVisibility((prev) => !prev);
  const type: "text" | "password" =
    !password || passwordVisibility ? "text" : "password";
  return { passwordVisibility, handleCLick, type };
};

// Errors handling

const WithErrorHandling = (
  Child: React.ComponentType<TextInputProps>
): React.ComponentType<WithHandlingError & TextInputProps> => {
  return ({
    validateHelpers,
    mutators,
    validateOptions,
    onchange,
    ...props
  }) => {
    const newOnchange: typeof onchange = (value, error) => {
      if (mutators) {
        mutators.forEach((mutator) => (value = mutator(value)));
      }
      if (validateHelpers) {
        for (const helper of validateHelpers) {
          if (!helper.validate(value, validateOptions || {})) {
            error = helper.error_text;
            break;
          }
        }
      }
      onchange(value, error);
    };
    return <Child {...props} onchange={newOnchange} />;
  };
};

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

const checkNotEmpty = (inputed: string) =>
  checkLength(inputed, { minLength: 1 });

const notEmpty: ValidateHelper = {
  validate: checkNotEmpty,
  error_text: "Поле не должно быть пустым",
};

// INPUT

// // TextInput

const TextInputNoHandlingError: FC<TextInputProps> = ({
  inputField,
  onchange,
  needHelperText = true,
  ...textFieldProps
}) => {
  const { value, error, unTouched } = inputField;
  return (
    <TextField
      className="editing-input"
      value={value}
      error={!unTouched && !!error}
      helperText={needHelperText ? (!unTouched && error) || " " : ""}
      onChange={(e) => onchange(e.target.value, "")}
      {...textFieldProps}
    ></TextField>
  );
};

const TextInput = WithErrorHandling(TextInputNoHandlingError);

// NotEmptyTextInput

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

// // PasswordInput

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

const PasswordVisibilityButton: FC<PVBProps> = ({ show = false, onclick }) => {
  return (
    <InputAdornment position="end">
      <Tooltip
        title={show ? "Скрыть пароль" : "Показать пароль"}
        arrow
        placement="top"
      >
        <IconButton aria-label="toggle password visibility" onClick={onclick}>
          {show ? <Visibility /> : <VisibilityOff />}
        </IconButton>
      </Tooltip>
    </InputAdornment>
  );
};

// Store

const defaulInputField: InputField = {
  error: "",
  value: "",
  unTouched: true,
};

const createSliceOptions = <N extends string>(
  name: string,
  initialState: FormState<N>
) => {
  return {
    name: `form/${name}`,
    initialState,
    reducers: {
      setInitialValues: (
        state: FormState<N>,
        action: PayloadAction<FormPayload<N>>
      ) => {
        const { payload } = action;
        Object.keys(payload).forEach((key) => {
          const fieldName = key as N;
          const value = payload[fieldName];
          state[fieldName].value = value;
          if (value !== "") state[fieldName].error = "";
        });
      },
      setTouchedAll: (state: FormState<N>) => {
        for (let name of Object.keys(state)) {
          state[name as N].unTouched = false;
        }
      },
      resetForm: () => {
        return initialState;
      },
      setInputField: {
        reducer: (
          state: FormState<N>,
          action: PayloadAction<WithInputField<N>>
        ) => {
          state[action.payload.name] = {
            ...action.payload.inputPayload,
            unTouched: false,
          };
        },
        prepare: (name: any, value: string, error: string) => {
          return { payload: { name, inputPayload: { value, error } } };
        },
      },
    },
  };
};

const isFormValid = <T extends FormState<any>>(formState: T): boolean => {
  for (const inputField of Object.values(formState)) {
    if (inputField.error) return false;
  }
  return true;
};

export {
  useForm,
  createSliceOptions,
  isFormValid,
  TextInput,
  PasswordInput,
  NotEmptyTextInput,
  WithHandlingError,
  ValidateHelper,
  ValidateOptions,
  InputMutator,
  InputValidator,
  InputField,
  FormState,
  TextInputProps,
  checkDiapason,
  checkLength,
  checkNotEmpty,
  notEmpty,
  defaulInputField,
};
