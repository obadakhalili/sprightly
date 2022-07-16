import { readFile } from "fs/promises"

interface Data {
  [key: string]: string | number | Array<string | number | Data> | Data
}

type Options = {
  cache?: boolean
  keyFallback?: string
  throwOnKeyNotfound?: boolean
}

const defaultOptions: Options = {
  keyFallback: "",
  throwOnKeyNotfound: false,
  cache: false,
}

export = async function sprightly(
  entryPoint: string,
  data: Data,
  options: Options = defaultOptions,
): Promise<string> {
  const regex = /<<(.*?)>>|\{\{(.*?)\}\}/gi
  const file = (await readFile(entryPoint)).toString()
  const result = file.replaceAll(regex, (match) => {
    const value = match.substring(3, match.length - 2).trim()
    if (isProperty(match[0]))
      return isNestedObject(value)
        ? getNestedValue(value, options.keyFallback, data)
        : getValue(value, options.keyFallback, data)
    else if (isComponent(match[0])) return sprightly(value, data, options)
    return ""
  })
  return result
}

const isProperty = (char: string): boolean => char === "{" || char === "}"

const isComponent = (char: string): boolean => char === "<"

const isNestedObject = (obj: string): boolean =>
  obj.includes(".") || obj.includes("[")

const getNestedValue = (keys: string, keyFallback = "", data: Data) => {
  const parsedKeys = keys
    .replaceAll(/\["?(.*?)"?\]|\./gi, (match) => {
      if (match[0] === ".") return " "
      return ` ${match.substring(1, match.length - 1)}`
    })
    .split(" ")
  return parsedKeys.reduce<any>((acc, key) => {
    if (typeof acc === "object") return getValue(key, keyFallback, acc)
    // this happens when number of keys exceeds the number of properties
    return keyFallback
  }, data)
}

const getValue = (key: string, keyFallback = "", data: Data) =>
  key in data ? data[key] : keyFallback
