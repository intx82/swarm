
import * as React from "react";
import {
    Slider,
} from "@fluentui/react";

import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { Checkbox, Stack } from "@fluentui/react";

/**
 * Конвертирует тип данных в компонент
 * @param {object} item 
 * @param {bool} devReadOnly 
 * @param {object} regValues
 * @param {Function} onChangeReg
 * @returns 
 */
export const DevMainCtrls = (item, devReadOnly, regValues, onChangeReg) => {
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
                    {item.name}: {ISODateString(regValues[item.id])}
                </h3>
            );
        }
        return (
            <h3>
                {item.name}:{" "}
                {item.type.name === "int"
                    ? regValues[item.id]
                    : calculate(regValues[item.id])}
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
                        ? regValues[item.id]
                        : calculate(regValues[item.id])
                }
                step={item.type.step > 0 ? item.type.step : 1}
                onChange={(val) => {
                    if (typeof onChangeReg === "function") {
                        onChangeReg(
                            regValues[0],
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
                {item.name}: {ISODateString(regValues[item.id])}
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
                                arr.push(testBit(regValues[item.id], i));
                            }

                            const rIdx = item.type.bits[index].id
                            return (
                                <Checkbox
                                    label={obj.name}
                                    disabled={obj.readonly || devReadOnly}
                                    key={`checkbox ${rIdx}`}
                                    checked={testBit(regValues[item.id], rIdx)}
                                    onChange={(val) => {
                                        arr[rIdx] = !arr[rIdx];
                                        if (typeof onChangeReg === "function") {
                                            onChangeReg(
                                                regValues[0],
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