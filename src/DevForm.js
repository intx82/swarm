import * as React from "react";
import { useId } from "@fluentui/react-hooks";
import {
  Modal,
  getTheme,
  mergeStyleSets,
  FontWeights,
  Slider,
  IconButton,
} from "@fluentui/react";

import { DefaultButton } from "@fluentui/react/lib/Button";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { Checkbox, Stack } from "@fluentui/react";

export const DevForm = (props) => {
  const titleId = useId("title");
  const devReadOnly = props.readOnly

  /**
   * Конвертирует тип данных в компонент
   * @param {object} item 
   * @returns 
   */
  const checkType = (item) => {
    /**
     * Преобразовывает Unixtime
     * @param {date} date 
     * @returns 
     */
    function ISODateString(date) {
      return new Date(date * 1000).toLocaleString('ru-RU');
    }

    /**
     * Преобразовывает в float
     * @param {number} inData 
     * @returns 
     */
    const calculate = (inData) => {
      const bFloat = new Uint8Array([
        (inData >> 24) & 0xff,
        (inData >> 16) & 0xff,
        (inData >> 8) & 0xff,
        inData & 0xff,
      ]).buffer;
      var view = new DataView(bFloat);
      return view.getFloat32(0, false).toFixed(2)
    };

    /**
     * Преобразовывает из float в uint32
     * @param {number} inData 
     * @returns 
     */
    const calculateToUint = (inData) => {
      var tmpBuf = new ArrayBuffer(4);
      new DataView(tmpBuf).setFloat32(0, inData);
      return new DataView(tmpBuf).getUint32(0, false);
    };

    /**
     * Преобразовывает биты
     * @param {Array} arr 
     * @returns 
     */
    const genBit = (arr) => {
      if (Array.isArray(arr)) {
        let res = 0;
        for (let i = 0; i < arr.length; i++) {
          if (arr[i]) {
            res |= 1 << i;
          } else {
            res &= ~(1 << i);
          }
        }
        return res;
      }
    };

    /**
     * Проверяет установлен ли бит
     * @param {number} num Входящее число 
     * @param {number} bitNum Номер бита
     * @returns 
     */
    function testBit(num, bitNum) {
      return (Number(num) & (1 << bitNum)) === 1 << bitNum;
    }

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
          disabled={devReadOnly}
          value={
            item.type.name === "int"
              ? props.regValues[item.id]
              : calculate(props.regValues[item.id])
          }
          step={item.type.step > 0 ? item.type.step : 1}
          onChange={(val) => {
            if (typeof props.onChangeReg === "function") {
              props.onChangeReg(
                props.regValues[0],
                item.id,
                calculateToUint(val)
              );
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
              {item.type.bits.map((obj, index) => {
                let arr = [];

                for (let i = 0; i < 32; i++) {
                  arr.push(testBit(props.regValues[item.id], i));
                }

                const rIdx = item.type.bits[index].id
                return (
                  <Checkbox
                    label={obj.name}
                    disabled={obj.readonly || devReadOnly}
                    key={`checkbox ${rIdx}`}
                    checked={testBit(props.regValues[item.id], rIdx)}
                    onChange={(val) => {
                      arr[rIdx] = !arr[rIdx];
                      if (typeof props.onChangeReg === "function") {
                        props.onChangeReg(
                          props.regValues[0],
                          item.id,
                          genBit(arr)
                        );
                      }
                    }}
                  />
                );
              })}
            </Stack>
          </AccordionDetails>
        </Accordion>
      );
    }
  };

  const devType = props.isOpen ? props.regValues[15] : 0
  const devDesc = props.devDesc.hasOwnProperty(devType) ? props.devDesc[devType] : props.devDesc['unknown']
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
        <span id={titleId}>{devDesc.name}</span>
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
        {devReadOnly ? <p>Для управления устройством необходима авторизация</p> : ''}
        {devDesc.regs.map((item, index) => {
          return (
            <div key={`item ${index}`}>
              {props.regValues ? checkType(item) : " "}
            </div>
          );
        })}
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
