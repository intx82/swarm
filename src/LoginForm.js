import * as React from "react";
import { useId } from "@fluentui/react-hooks";
import {
  Modal,
  getTheme,
  mergeStyleSets,
  FontWeights,
  IconButton,
} from "@fluentui/react";

import { DefaultButton } from "@fluentui/react/lib/Button";

export const LoginForm = (props) => {
  const titleId = useId("title");

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
      <hr style={{ color: "#f0f0f0", backgroundColor: "#f0f0f0" }} />
      <div className={contentStyles.body}>

      </div>
      <hr style={{ color: "#f0f0f0", backgroundColor: "#f0f0f0" }} />
      <DefaultButton
        text="Закрыть"
        onClick={
          typeof props.onCancel === "function"
            ? props.onCancel
            : () => console.log("Cancel")
        }
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
});
