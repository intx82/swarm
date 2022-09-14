import * as React from "react";
import { Window } from "./Window";
import {
    Stack,
    TextField,
    Checkbox
} from "@fluentui/react";


import { sha256 } from "js-sha256"


function genUID(login, pwd) {
    let hash = String(login) + '\0' + String(pwd)
    const hasher = sha256.update(hash)
    return new Uint8Array(hasher.arrayBuffer())
}

/**
 * Основная форма пользователя
 *
 * @param {*} props
 * @returns
 */
export const UserForm = (props) => {
    const [pwd, setPwd] = React.useState(['0', '1']);
    const [login, setLogin] = React.useState(props.user ? props.user.n : null);
    const [perm, setPerm] = React.useState(63);

    const validateLogin = (mail) => {
        return !!String(mail)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{1,}))$/
            );
    };

    const [disPwd, setDisPwd] = React.useState(!props.user);

    const onConfirm = () => {
        props.onConfirm({'n': login, 'p': perm, 'u': genUID(login, pwd[0]) })
    }


    const formName = props.user ? `Редактирование пользователя: ${props.user.n}` : "Добавление пользователя"
    return <Window
        title={formName}
        onCancel={props.onCancel}
        DefaultBtnText= {props.user ? `Изменить` : "Добавить"}
        onDefaultBtn={onConfirm}
        DefaultBtnDisable={disPwd || pwd[0] !== pwd[1] || (String(pwd[0]).length < 8)}
    >

        <Stack tokens={{ 'childrenGap': 10 }}>
            <TextField
                label="E-Mail (имя пользователя)"
                placeholder="user@domain"
                onChange={(val) => {
                    setLogin(val.target.value)
                    setDisPwd(!validateLogin(login))
                }}
                defaultValue={props.user ? props.user.n : undefined }
            />
            <TextField
                label="Пароль (>8 символов)"
                type="password"
                canRevealPassword
                disabled={disPwd}
                onChange={(val) => {
                    setPwd([val.target.value, pwd[1]])
                }}
                revealPasswordAriaLabel="Показать пароль"
            />
            <TextField
                label="Еще раз пароль"
                type="password"
                canRevealPassword
                disabled={disPwd}
                onChange={(val) => {
                    setPwd([pwd[0], val.target.value])
                }}
                revealPasswordAriaLabel="Показать пароль"
                errorMessage={pwd[0] !== pwd[1] ? "Пароли не совпадают" : undefined }
            />
            <Checkbox label="Администратор" onChange={(val) => {
                    setPerm(val ? 255 : 63)
                }}/>
        </Stack>
    </Window>
};
