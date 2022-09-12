

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
    mergeStyleSets
} from "@fluentui/react";


const contentStyles = mergeStyleSets({
    dtListCell: {
        display: "flex",
        alignItems: "center",
        height: "32px",
        fontSize: "10pt"
    }
})


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
        return <div className={contentStyles.dtListCell}>{val['n']}</div>
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
        return <div className={contentStyles.dtListCell}>{val['u']}</div>
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
        return <div className={contentStyles.dtListCell}>{val['p']}</div>
    }
}];

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

    React.useEffect(() => {
        console.log(selectedItems)
    }, [selectedItems])


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


    const showAddUserWnd = () => {
        console.log('Add')
    }

    const showEditUserWnd = () => {
        console.log('edit:', selectedItems[0])
    }

    const onRemoveUsers = () => {
        console.log('remove', selectedItems)
    }

    const cmdBarItems = [
        {
            key: 'add',
            text: 'Добавить',
            iconOnly: true,
            iconProps: { iconName: 'Add' },
            onClick: showAddUserWnd,
        },
        {
            key: 'edit',
            text: 'Изменить',
            iconOnly: true,
            disabled: selectedItems.length !== 1,
            iconProps: { iconName: 'Edit' },
            onClick: showEditUserWnd,
        },
        {
            key: 'remove',
            text: 'Удалить',
            iconOnly: true,
            disabled: selectedItems.length === 0,
            iconProps: { iconName: 'Remove' },
            onClick: onRemoveUsers,
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

    if (state === 3) {
        return <Stack>
            <StackItem>
                <Label>Нет ответа от устройства</Label>
            </StackItem>
            <StackItem>
                <PrimaryButton
                    text="Повторить"
                    onClick={() => {
                        setState(0);
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
                compact
            />
            : <Label>Нет пользователей в устройстве. <Link onClick={showAddUserWnd}>Добавить?</Link></Label>
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
            <StackItem> <Spinner>Получение списка пользователей</Spinner></StackItem>
        </Stack>
    }

}