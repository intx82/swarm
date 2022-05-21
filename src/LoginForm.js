import * as React from "react";
import { useState } from "react";
import { useCookies } from 'react-cookie';

import {
    Stack,
    TextField,
    Checkbox
} from "@fluentui/react";

import { sha256 } from "js-sha256"
import { Window } from "./Window";

export const LoginForm = (props) => {
    const [pwd, setPwd] = useState(null);
    const [login, setLogin] = useState(null);
    const [saveCreds, setSaveCreds] = useState(false);
    const [cookie, setCookie,] = useCookies(['uid', 'login']);


    const validateLogin = (mail) => {
        return !!String(mail)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
    };

    const [disPwd, setDisPwd] = useState('login' in cookie ? !validateLogin(cookie['login']) : true);

    const onLoginFn = typeof props.onLogin === "function"
        ? () => {
            if (!('login' in cookie) && !login) {
                setDisPwd(true)
                return
            }

            const _login = login ? login : 'login' in cookie ? cookie['login'] : null

            let hash = String(_login) + '\0' + String(pwd)
            const hasher = sha256.update(hash)
            const _uHash = new Uint8Array(hasher.arrayBuffer())
            if (saveCreds) {
                var exp = new Date();
                exp.setDate(exp.getDate() + 1)

                setCookie('uid', Buffer.from(_uHash).toString('base64'), {
                    'path': '/',
                    'sameSite': 'strict',
                })
                setCookie('login', _login, {
                    'sameSite': 'strict',
                    'maxAge': (60 * 60 * 24)
                })
            }
            props.onLogin(_login, pwd, _uHash)
        }
        : () => console.log("Login")

    return (
        <Window
            title="Авторизация пользователя"
            onCancel={props.onCancel}
            DefaultBtnText="Вход"
            onDefaultBtn={onLoginFn}
            DefaultBtnDisable={disPwd || (String(pwd).length < 8)}
        >
            <Stack tokens={{'childrenGap': 10}}>
                <TextField
                    label="E-Mail"
                    placeholder="user@domain"
                    defaultValue={'login' in cookie ? cookie['login'] : undefined}
                    onChange={(val) => {
                        setLogin(val.target.value)
                        setDisPwd(!validateLogin(login))
                    }}
                />
                <TextField
                    label="Пароль"
                    type="password"
                    canRevealPassword
                    disabled={disPwd}
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
                <Checkbox sty  label="Запомнить меня (используя cookie)" onChange={(val) => {
                    setSaveCreds(val)
                }} />
            </Stack>
        </Window>
    );
};
