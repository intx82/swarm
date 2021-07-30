import * as React from "react";
import { useId } from "@fluentui/react-hooks";
import {
  Modal,
  getTheme,
  mergeStyleSets,
  FontWeights,
  Slider,
  IconButton
} from "@fluentui/react";


import { DefaultButton } from "@fluentui/react/lib/Button";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { Checkbox, Stack } from "@fluentui/react";

export const ModalComponent = (props) => {

  const titleId = useId("title");
  const checkType = (item) => {
    function ISODateString(date) {
      let time = new Date(date * 1000);
      function pad(n) {
        return n < 10 ? "0" + n : n;
      }
      return (
        time.getUTCFullYear() +
        "-" +
        pad(time.getUTCMonth() + 1) +
        "-" +
        pad(time.getUTCDate()) +
        " " +
        pad(time.getUTCHours()) +
        ":" +
        pad(time.getUTCMinutes()) +
        ":" +
        pad(time.getUTCSeconds())
      );
    }

    const calculate = (inData) => {
      const bFloat = new Uint8Array([
        (inData >> 24) & 0xff,
        (inData >> 16) & 0xff,
        (inData >> 8) & 0xff,
        inData & 0xff,
      ]).buffer;
      var view = new DataView(bFloat);
      return view.getFloat32(0, false);
    };

    const calculateToUint = (inData) => {
      var tmpBuf = new ArrayBuffer(4);
      new DataView(tmpBuf).setFloat32(0, inData);
      return new DataView(tmpBuf).getUint32(0, false);
    };

    if (item.readonly) {
      if (item.type.name === "unixtime") {
        return (
          <h3>
            {item.name}: {ISODateString(props.regValues[item.id])}
          </h3>
        );
      }
      return (
        <h3>
          {item.name}:{" "}
          {item.type.name === "int"
            ? props.regValues[item.id]
            : calculate(props.regValues[item.id])}
        </h3>
      );
    } else if (item.type.name === "int" || item.type.name === "float") {
      return (
        <Slider
          label={item.name}
          min={item.type.minimum}
          max={item.type.maximum}
          defaultValue={item.type.name === "int" ? props.regValues[item.id] : calculate(props.regValues[item.id])}
          step={item.type.step > 0 ? item.type.step : 1}
          onChange={(val) => {
            if (typeof props.onChangeReg === "function") {
              props.onChangeReg(props.regValues[0], item.id, calculateToUint(val));
            }
          }}
          showValue
        />
      );
    } else if (item.type.name === "unixtime") {
      return (
        <p>
          {item.name}: {ISODateString(props.regValues[item.id])}
        </p>
      );
    } else if (item.type.name === "bitfield") {
      return (
        <Accordion style={{ marginTop: "20px" }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            {" "}
            <h3 className="openAcc">{item.name}</h3>
          </AccordionSummary>
          <AccordionDetails>
            <Stack tokens={{ childrenGap: 10 }}>
              {item.type.bits.map((item, index) => {
                return (
                  <Checkbox
                    label={item.name}
                    disabled={item.readonly}
                    key={index}
                  />
                );
              })}
            </Stack>
          </AccordionDetails>
        </Accordion>
      );
    }
  };

  return (
    <Modal
      titleAriaId={titleId}
      isOpen={props.isOpen}
      onDismiss={typeof props.onCancel === "function" ? props.onCancel : () => console.log('Cancel')}
      containerClassName={contentStyles.container}
    >
      <div className={contentStyles.header}>
        <span id={titleId}>{props.devDesc.name}</span>
        <IconButton
          className={contentStyles.iconButtonStyles}
          onClick={typeof props.onCancel === "function" ? props.onCancel : () => console.log('Cancel')}
          iconProps={cancelIcon}
          ariaLabel="Close popup modal"
        />
      </div>
      <hr style={{ color: "#f0f0f0", backgroundColor: "#f0f0f0" }} />
      <div className={contentStyles.body}>
        {props.devDesc.regs.map((item, index) => {
          return <div key={index}>{props.regValues ? checkType(item) : " "}</div>;
        })}
      </div>
      <hr style={{ color: "#f0f0f0", backgroundColor: "#f0f0f0" }} />
      <DefaultButton
        text="Закрыть"
        onClick={typeof props.onCancel === "function" ? props.onCancel : () => console.log('Cancel')}
        style={{ marginLeft: "360pt", marginBottom: "12pt" }}
      />
    </Modal>
  );

};

const theme = getTheme();


const cancelIcon = { iconName: 'Cancel' };


const contentStyles = mergeStyleSets({
  container: {
    display: "flex",
    flexFlow: "column nowrap",
    alignItems: "stretch",
    width: "480pt",
  },
  iconButtonStyles: {
    color: "#333333",
    marginLeft: 'auto',
    marginTop: '4px',
    marginRight: '2px',
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
