import * as React from "react";
import { useState } from "react";
import {
  Stack,
  TextField
} from "@fluentui/react";

import { sha256 } from "js-sha256"
import { Window } from "./Window";

export const LoginForm = (props) => {
  const [pwd, setPwd] = useState(null);
  const [login, setLogin] = useState(null);

  const validateLogin = (mail) => {
    return !!String(mail)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const onLoginFn = typeof props.onLogin === "function"
    ? () => {
      let hash = String(login) + '\0' + String(pwd)
      const hasher = sha256.update(hash)
      props.onLogin(login, pwd, new Uint8Array(hasher.arrayBuffer()))
    }
    : () => console.log("Login")

  return (
    <Window 
      title="Авторизация пользователя"
      onCancel={props.onCancel}
      DefaultBtnText="Вход"
      onDefaultBtn={onLoginFn}
      DefaultBtnDisable={(!validateLogin(login)) || (String(pwd).length < 8)}
    >
      <Stack>
        <TextField
          label="E-Mail"
          placeholder="user@domain"
          onChange={(val) => {
            setLogin(val.target.value)
          }}
        />
        <TextField
          label="Пароль"
          type="password"
          canRevealPassword
          disabled={!validateLogin(login)}
          onChange={(val) => {
            setPwd(val.target.value)
          }}
          revealPasswordAriaLabel="Показать пароль"
          onKeyUp={(event) => {
            if (event.key === 'Enter' && validateLogin(login) && String(pwd).length >= 8) {
              onLoginFn()
            }
          }}
        />
      </Stack>
    </Window>
  );
};
