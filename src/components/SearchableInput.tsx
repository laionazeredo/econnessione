import { useStyletron } from "baseui"
import { Input, StyledInput } from "baseui/input"
import * as A from "fp-ts/lib/Array"
import * as O from "fp-ts/lib/Option"
import { pipe } from "fp-ts/lib/pipeable"
import * as React from "react"
import { List } from "./Common/List"

export interface SearchableItem {
  uuid: string
}

interface ItemProps<I extends SearchableItem> {
  onClick: (i: I) => void
}

interface InputReplacementProps<I extends SearchableItem> {
  value: string
  setValue: (v: string) => void
  getValue: (i: I) => string
  selectedItems: I[]
  items: I[]
  selectItem: (i: I) => void
  removeItem: (i: I) => void
  itemRenderer: (i: I, props: ItemProps<I>, index: number) => React.ReactElement
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
}

// eslint-disable-next-line react/display-name
const InputReplacement = React.forwardRef<
  any,
  InputReplacementProps<SearchableItem>
>(
  (
    {
      value,
      setValue,
      selectedItems,
      items,
      itemRenderer,
      getValue,
      removeItem,
      selectItem,
      ...restProps
    },
    ref
  ) => {
    const [css] = useStyletron()

    return (
      <div
        className={css({
          flex: "1 1 0%",
          flexWrap: "wrap",
          display: "flex",
          alignItems: "center",
        })}
      >
        {selectedItems.map((item: SearchableItem, index: number) =>
          itemRenderer(
            { ...item },
            {
              ...restProps,
              onClick: (item) => {
                removeItem(item)
                setValue("")
              },
            },
            index
          )
        )}
        <StyledInput ref={ref} value={value} {...restProps} />
        <List<SearchableItem>
          data={items.filter(
            (i) => getValue(i).startsWith(value)
          )}
          getKey={getValue}
          filter={(i) => true}
          ListItem={({ item, index }) =>
            itemRenderer(
              item,
              {
                ...restProps,
                onClick: () => {
                  selectItem(item)
                },
              },
              index
            )
          }
        />
      </div>
    )
  }
)

interface SearchableInputProps<I extends SearchableItem> {
  placeholder?: string
  items: I[]
  getValue: (i: I) => string
  itemRenderer: (item: I, props: ItemProps<I>, index: number) => JSX.Element
  onSelectItem: (item: I, selectedItems: I[]) => void
  onUnselectItem: (item: I, selectedItems: I[]) => void
}

const SearchableInput = <I extends SearchableItem>(
  props: SearchableInputProps<I>
): JSX.Element => {
  const [value, setValue] = React.useState("")
  const [items, setItems] = React.useState<I[]>([])

  const setItemAndClearValue = (item: I): void => {
    setItems([...items, item])
    setValue("")
    props.onSelectItem(item, [...items, item])
  }

  const unsetItemAndClearValue = (item: I): void => {
    setItems(items.filter((t) => props.getValue(t) !== props.getValue(item)))
    setValue("")
    props.onUnselectItem(item, [...items, item])
  }

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    switch (event.keyCode) {
      // Enter
      case 13: {
        if (value === undefined || value === "") return
        pipe(
          props.items,
          A.findFirst((a) => props.getValue(a).startsWith(value)),
          O.map((i) => setItemAndClearValue(i))
        )
        return
      }
      // Backspace
      case 8: {
        if (value === undefined || items.length === 0) return
        unsetItemAndClearValue(items[items.length - 1])
      }
    }
  }

  const placehoder = props.placeholder ?? "Search..."

  const inputReplacementProps: InputReplacementProps<I> = {
    value: value,
    items: props.items.filter(
      (i) => !items.map((ii) => props.getValue(ii)).includes(props.getValue(i))
    ),
    getValue: props.getValue,
    onKeyDown: handleKeyDown,
    itemRenderer: props.itemRenderer,
    selectedItems: items,
    setValue,
    selectItem: setItemAndClearValue,
    removeItem: unsetItemAndClearValue,
  }

  return (
    <Input
      placeholder={placehoder}
      value={value}
      onChange={(e) => setValue(e.currentTarget.value)}
      // onFocus={}
      onBlur={(e) => {
        if (e.currentTarget.value !== "") {
          pipe(
            props.items,
            A.findFirst((a) =>
              props.getValue(a).startsWith(e.currentTarget.value)
            ),
            O.map((i) => setItemAndClearValue(i))
          )
        }
      }}
      overrides={{
        Input: {
          style: { width: "auto", flexGrow: 1 },
          component: InputReplacement as any,
          props: inputReplacementProps,
        },
      }}
    />
  )
}

export default SearchableInput