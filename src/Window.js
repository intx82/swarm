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

/**
 * Окно
 * @param {*} props => { isOpen: '', onCancel: '', title: '', children: '' }
 * @returns 
 */
export const Window = (props) => {
  const titleId = useId("title");
  const modalStyle = mergeStyleSets({
    container: {
      display: "flex",
      flexFlow: "column nowrap",
      alignItems: "stretch",
      width: 'width' in props ? props.width : '640pt'
    },
  });

  return (
    <Modal
      titleAriaId={titleId}
      isOpen={typeof props.isOpen === 'boolean' ? props.isOpen : true}
      onDismiss={
        typeof props.onCancel === "function"
          ? props.onCancel
          : () => console.log("Cancel")
      }
      containerClassName={modalStyle.container}
      style={{width: '640pt'}}
    >
      <div className={contentStyles.header}>
        <span id={titleId}>{props.title}</span>
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
        {props.children}
      </div>
      <hr style={{ color: "#f0f0f0", backgroundColor: "#f0f0f0" }} />
      <DefaultButton
        text={typeof props.DefaultBtnText === "string" ? props.DefaultBtnText : "Закрыть"}
        onClick={
          typeof props.onDefaultBtn === "function"
            ? props.onDefaultBtn
            : typeof props.onCancel === "function" ? props.onCancel
              : () => console.log("Cancel")
        }
        disabled={props.DefaultBtnDisable}
        style={{ marginLeft: "12pt", marginBottom: "12pt" }}
      />
    </Modal>
  );
};

const theme = getTheme();

const cancelIcon = { iconName: "Cancel" };

const contentStyles = mergeStyleSets({
 
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
