import { readFileSync } from "fs"
import path from "path"
import KeyNotFoundError from "./errors/KeyNotFoundError"
import PathNotFoundError from "./errors/PathNotFoundError"

interface Data {
  [key: string]: string | number | Array<string | number | Data> | Data
}

interface Options {
  keyFallback?: string
  throwOnKeyNotfound?: boolean
  cache?: boolean
}

const cache = new Map<string, string>()

const defaultOptions = {
  keyFallback: "",
  throwOnKeyNotfound: false,
  cache: false,
}

function parse(file: string, data: Data, options: Options) {
  const parsedFile = file.replaceAll(
    /\{\{(>?)(.*?)\}\}/g,
    (_, isComponent: string, reference: string) => {
      if (isComponent) {
        try {
          return sprightly(reference, data, options)
        } catch (e) {
          throw new PathNotFoundError(reference.trim())
        }
      }
      return reference
        .split(/((?:\w+))(?:(?:\[)(\d+)(?:\]))?(?:\.?)/gm)
        .filter((v) => v && Boolean(v.trim()))
        .reduce((obj, key) => {
          if (
            typeof obj === "object" &&
            !(key in obj) &&
            options.throwOnKeyNotfound
          )
            throw new KeyNotFoundError(key.trim())
          return (obj[key] || options.keyFallback) as Data
        }, data) as unknown as string
    },
  )
  return parsedFile
}

function sprightly(
  entryPoint: string,
  data: Data,
  options: Options = defaultOptions,
): string {
  options = {
    ...defaultOptions,
    ...options,
  }
  const entryPointAbsolutePath = path.resolve(path.normalize(entryPoint.trim()))
  if (options.cache && cache.has(entryPointAbsolutePath))
    return cache.get(entryPointAbsolutePath) as string
  try {
    const file = readFileSync(entryPointAbsolutePath).toString()
    const parsedFile = parse(file, data, options)
    if (options.cache && !cache.has(entryPointAbsolutePath))
      cache.set(entryPointAbsolutePath, parsedFile)
    return parsedFile
  } catch (error) {
    if (error instanceof KeyNotFoundError)
      throw `Key "${error.key}" not found in "data" at ${entryPointAbsolutePath}`
    if (error instanceof PathNotFoundError)
      throw `Component ${error.component} was not found in ${entryPointAbsolutePath}`
    throw error
  }
}
export = (entryPoint: string, data: Data, options: Options = defaultOptions) =>
  new Promise<string>((resolve, reject) => {
    try {
      resolve(sprightly(entryPoint, data, options))
    } catch (error) {
      reject(error as string)
    }
  })
