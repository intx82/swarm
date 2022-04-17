

import * as React from "react";
import { ComboBox, Stack, StackItem, Label, PrimaryButton, ProgressIndicator } from "@fluentui/react";

/**
 * Форма для управления обновлением прошивки
 * @param {*} props 
 * @returns 
 */
export const DevFw = (props) => {
    const devRegs = props.devState !== null ? props.devState['regs'] : null
    const devType = devRegs !== null ? devRegs[15] : 0
    const updater = props.updater ? props.updater : {}
    const devReadOnly = props.devState['auth'] & !(!!props.user.hash)
    const [ver, branch, commit] = props.devState.version ? props.devState.version.toString().split(';', 3) : [devReadOnly ? 'Для получение версии необходима авторизация' : 'Ошибка получения версии', '', '']

    const [selectedFw, setSelectedFw] = React.useState(updater[devType][updater[devType].length - 1])
    const [updProgress, setUpdProgress] = React.useState(null)

    function onSelectFw(evt, opt) {
        setSelectedFw(opt.tag)
    }

    function onWriteFw() {
        if (typeof props.onFwUpd === "function") {
            props.onFwUpd(props.devState, selectedFw, props.user, setUpdProgress)
        } else {
            console.log('onWriteFw: [dev: ', props.devState,', fw: ', selectedFw, ", user: ", props.user.hash, ']')
        }
    }

    if (updProgress) {
        if (updProgress < selectedFw['s']) {
            return <ProgressIndicator
                label="Обновление прошивки"
                description={`${Math.round(10000 * (updProgress / selectedFw['s']), 2) / 100}% (${updProgress} / ${selectedFw['s']})`}
                percentComplete={updProgress / selectedFw['s']} />
        } else {
            setTimeout(() => {
                props.devState.version = null
                setUpdProgress(null)
            }, 2500)
            return <Label>
                Перезагрузка устройства и последующение обновление
            </Label>
        }
    } else {
        return <Stack>
            <StackItem><Label>Текущая версия: <b>{ver} {branch} {commit}</b></Label></StackItem>
            {!devReadOnly ?
                <StackItem style={{ marginBottom: '4pt' }}>
                    <ComboBox
                        onChange={onSelectFw}
                        label="Доступные версии ПО устройства:"
                        defaultSelectedKey={selectedFw['r']}
                        options={updater[devType].map((v) => {
                            return {
                                key: v['r'],
                                text: `${v['r']} ${v['b']} ${v['c']} Размер: ${Number.parseInt(v['s']) * 1024} кб`,
                                tag: v
                            }
                        })}
                    /></StackItem> : ''}
            {!devReadOnly ? <StackItem align="end"><PrimaryButton disabled={!props.devState.version} text="Записать" onClick={onWriteFw} /></StackItem> : ''}
        </Stack>
    }
}