import * as React from "react";
import { useState } from "react";
import { useId } from "@fluentui/react-hooks";
import {
  Modal,
  getTheme,
  mergeStyleSets,
  FontWeights,
  IconButton,
  Stack,
  TextField,
  PrimaryButton
} from "@fluentui/react";

import { sha256 } from "js-sha256"

export const LoginForm = (props) => {
  const titleId = useId("title");
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
    <Modal
      titleAriaId={titleId}
      isOpen={props.isOpen}
      onDismiss={
        typeof props.onCancel === "function"
          ? props.onCancel
          : () => console.log("Cancel")
      }
      containerClassName={contentStyles.container}
    >
      <div className={contentStyles.header}>
        <span id={titleId}>Авторизация пользователя</span>
        <IconButton
          className={contentStyles.iconButtonStyles}
          onClick={
            typeof props.onCancel === "function"
              ? props.onCancel
              : () => console.log("Cancel")
          }
          iconProps={cancelIcon}
          ariaLabel="Close popup modal"
        />
      </div>
      <hr className={contentStyles.hr} />
      <div className={contentStyles.body}>
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
      </div>
      <hr className={contentStyles.hr} />
      <PrimaryButton
        text="Вход"
        disabled={(!validateLogin(login)) || (String(pwd).length < 8)}
        onClick={onLoginFn}
        style={{ marginLeft: "12pt", marginBottom: "12pt" }}
      />
    </Modal>
  );
};

const theme = getTheme();

const cancelIcon = { iconName: "Cancel" };

const contentStyles = mergeStyleSets({
  container: {
    display: "flex",
    flexFlow: "column nowrap",
    alignItems: "stretch",
    width: "480pt",
  },
  iconButtonStyles: {
    color: "#333333",
    marginLeft: "auto",
    marginTop: "4px",
    marginRight: "2px",
  },
  header: [
    theme.fonts.xLargePlus,
    {
      flex: "1 1 auto",
      borderTop: `4px solid ${theme.palette.themePrimary}`,
      color: theme.palette.neutralPrimary,
      display: "flex",
      alignItems: "center",
      fontWeight: FontWeights.light,
      padding: "12px 12px 14px 24px",
      justifyContent: "space-between",
    },
  ],
  body: {
    flex: "4 4 auto",
    padding: "0 24px 24px 24px",
    overflowY: "hidden",
    selectors: {
      p: { margin: "14px 0" },
      "p:first-child": { marginTop: 0 },
      "p:last-child": { marginBottom: 0 },
    },
  },
  hr: {
    color: "#f0f0f0",
    backgroundColor: "#f0f0f0",
  },
});
