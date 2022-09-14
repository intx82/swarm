

import * as React from "react";
import {
    Stack,
    StackItem,
    Spinner,
    Label,
    PrimaryButton,
    Selection,
    Link,
    CommandBar,
    DetailsList,
    DetailsListLayoutMode,
    Dialog,
    DialogFooter,
    DefaultButton,
    DialogType,
    Icon,
} from "@fluentui/react";

import { UserForm } from "./UserForm";

const TblHdr = [{
    enable: true,
    key: "name",
    fieldName: "n",
    name: "E-Mail",
    minWidth: 64,
    maxWidth: 128,
    isPadded: true,
    isResizable: true,
    onRender: (val) => {
        return <div>{val['n']}</div>
    }
}, {
    enable: true,
    key: "uid",
    fieldName: "u",
    name: "Ключ пользователя",
    minWidth: 64,
    maxWidth: 384,
    isPadded: true,
    isResizable: true,
    onRender: (val) => {
        return <div>{val['u']}</div>
    }
}, {
    enable: true,
    key: "access",
    fieldName: "p",
    name: "Уровень доступа",
    minWidth: 64,
    maxWidth: 128,
    isPadded: true,
    isResizable: true,
    onRender: (val) => {
        return <div>{val['p'] > 63 ? "Администратор" : "Пользователь"}</div>
    }
}];


const UserList = (props) => {
    return <div>
        <Label>Вы действительно хотите удалить: </Label>
        <ul>
            {
                props.users.map((v, i, a) => {
                    return <li key={i}>{v['n']}</li>
                })
            }
        </ul>
    </div>
}

/**
 * Форма для управления обновлением прошивки
 * @param {*} props
 * @returns
 */
export const DevUsers = (props) => {

    const dev = props.devState
    const [state, setState] = React.useState(0)
    const [userList, setUserList] = React.useState(null)

    const [selectedItems, setSelectedItem] = React.useState([])
    const selection = new Selection({
        onSelectionChanged: () => {
            setSelectedItem(selection.getSelection())
        }
    })

    if (props.devState.auth && !props.user.hash) {
        return <Stack>
            <StackItem>
                <Label>Необходима авторизация</Label>
            </StackItem>
        </Stack>
    }

    if (props.user) {
        dev.usersBase.setUser(props.user)
    }

    const resetForm = () => {
        setSelectedItem([])
        setState(0)
    }

    const onAddUser = (u) => {
        setState(5)
        props.onAddUser?.(dev, u, () => {
            setTimeout(() => resetForm(), 3000)
            setState(6)
        }, () => {
            setTimeout(() => resetForm(), 3000)
            setState(7)
        })
    }

    const onChanegUser = (old, u) => {
        setState(5)
        props.onChangeUser?.(dev, old, u, () => {
            setTimeout(() => resetForm(), 3000)
            setState(6)
        }, () => {
            setTimeout(() => resetForm(), 3000)
            setState(7)
        })
    }

    const cmdBarItems = [
        {
            key: 'add',
            text: 'Добавить',
            iconOnly: true,
            iconProps: { iconName: 'Add' },
            onClick: () => setState(4),
        },
        {
            key: 'edit',
            text: 'Изменить',
            iconOnly: true,
            disabled: selectedItems.length !== 1,
            iconProps: { iconName: 'Edit' },
            onClick: () => setState(4),
        },
        {
            key: 'remove',
            text: 'Удалить',
            iconOnly: true,
            disabled: selectedItems.length === 0,
            iconProps: { iconName: 'Remove' },
            onClick: () => setState(8),
        },
    ]

    if (state === 0) {
        dev.usersBase.getUserList((l) => {
            if (l) {
                setUserList(l)
                setState(2)
            }
        }, () => {
            setState(3)
        })
        setState(1)
    }



    if (state === 8) {
        const dialogContentProps = {
            type: DialogType.largeHeader,
            title: selectedItems.length > 1 ? 'Удаление пользователей' : 'Удаление пользователя',
            subText: <UserList users={selectedItems} />
        };

        return <Dialog
            hidden={state !== 8}
            onDismiss={() => resetForm()}
            dialogContentProps={dialogContentProps}
        >
            <DialogFooter>
                <PrimaryButton onClick={() => {
                    console.log(props.onRemoveUsers)

                    props.onRemoveUsers?.(dev, selectedItems, () => {
                        setTimeout(() => resetForm(), 3000)
                        setState(6)
                    }, () => {
                        setTimeout(() => resetForm(), 3000)
                        setState(7)
                    })
                }} text="Удалить" style={{ backgroundColor: "#a4373a", border: "1px solid #d83b01" }} />
                <DefaultButton onClick={() => resetForm()} text="Отмена" />
            </DialogFooter>
        </Dialog>
    } else if (state === 7) {
        return <Stack>
            <StackItem align="center"><Icon iconName="StatusCircleErrorX" style={{ fontSize: "96px", color: "#a4373a" }} /></StackItem>
            <StackItem align="center"><Label>Ошибка выполнения</Label></StackItem>
        </Stack>
    } else if (state === 6) {
        return <Stack>
            <StackItem align="center"><Icon iconName="StatusCircleCheckmark" style={{ fontSize: "96px", color: "#31752f" }} /></StackItem>
            <StackItem align="center"><Label>Выполнено</Label></StackItem>
        </Stack>
    }
    else if (state === 5) {
        return <Spinner label={'Выполнение операции'} ariaLive="assertive" labelPosition="top" />
    } else if (state === 4) {
        return <UserForm user={selectedItems.length > 0 ? selectedItems[0] : undefined} onCancel={() => {
            resetForm()
        }}
            onConfirm={selectedItems.length > 0 ? (u) => onChanegUser(selectedItems[0], u) : onAddUser} />
    } else if (state === 3) {
        return <Stack>
            <StackItem>
                <Label>Нет ответа от устройства</Label>
            </StackItem>
            <StackItem>
                <PrimaryButton
                    text="Повторить"
                    onClick={() => {
                        resetForm()
                    }} />
            </StackItem>
        </Stack>
    } else if (state === 2) {
        let ret = userList.length ?
            <DetailsList
                items={userList}
                columns={TblHdr}
                setKey="users"
                layoutMode={DetailsListLayoutMode.justified}
                selection={selection}
                onItemInvoked={() => setState(4)}
                compact
            />
            : <Label>Нет пользователей в устройстве. <Link onClick={() => setState(4)}>Добавить?</Link></Label>
        return <Stack style={{ 'margin': '0px -21px', 'padding': 0 }}>
            <StackItem>
                <CommandBar
                    items={cmdBarItems}
                />
            </StackItem>
            <StackItem>
                {ret}
            </StackItem>
        </Stack>
    } else {
        return <Stack>
            <StackItem> <Spinner label="Получение списка пользователей" /></StackItem>
        </Stack>
    }

}