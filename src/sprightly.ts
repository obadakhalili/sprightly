import { readFileSync } from "fs"
import path from "path"

interface Data {
  [key: string]: string | number | Array<string | number | Data> | Data
}

class KeyNotFoundError extends Error {
  readonly key: string
  readonly src: string
  constructor(key: string, src: string) {
    const message = `Key "${key}" not found in "data" at ${src}`
    super(message)
    this.key = key
    this.src = src
  }
}

class PathNotFoundError extends Error {
  readonly component: string
  readonly src: string
  constructor(component: string, src: string) {
    const message = `Component "${component}" was not found in ${src}`
    super(message)
    this.component = component
    this.src = src
  }
}

interface Options {
  keyFallback?: string
  throwOnKeyNotfound?: boolean
  cache?: boolean
}

function parse(file: string, data: Data, options: Options) {
  const parsedFile = file.replaceAll(
    /\{\{(>?)(.*?)\}\}/g,
    (_, isComponent: string, reference: string) => {
      reference = reference.trim()
      if (isComponent) {
        try {
          return sprightly(reference, data, options)
        } catch (e) {
          throw new PathNotFoundError(reference, "")
        }
      }

      return reference
        .split(/((?:\w+))(?:(?:\[)(\d+)(?:\]))?(?:\.?)/gm)
        .filter((v) => v?.trim())
        .reduce((obj, key) => {
          key = key.trim()
          if (
            typeof obj === "object" &&
            options.throwOnKeyNotfound &&
            !(key in obj)
          ) {
            throw new KeyNotFoundError(key, "")
          }

          return (obj[key] || options.keyFallback) as Data
        }, data) as unknown as string
    },
  )
  return parsedFile
}

const cache = new Map<string, string>()

const defaultOptions = {
  keyFallback: "",
  throwOnKeyNotfound: false,
  cache: false,
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

  console.log(path.resolve(entryPoint))
  const entryPointAbsolutePath = path.resolve(path.normalize(entryPoint))
  if (options.cache && cache.has(entryPointAbsolutePath)) {
    return cache.get(entryPointAbsolutePath)!
  }

  try {
    const file = readFileSync(entryPointAbsolutePath).toString()
    const parsedFile = parse(file, data, options)

    if (options.cache && !cache.has(entryPointAbsolutePath)) {
      cache.set(entryPointAbsolutePath, parsedFile)
    }

    return parsedFile
  } catch (error) {
    if (error instanceof KeyNotFoundError) {
      throw new KeyNotFoundError(error.key, entryPoint)
    }
    if (error instanceof PathNotFoundError) {
      throw new PathNotFoundError(error.component, entryPoint)
    }
    throw error
  }
}
export = function sprightlyAsync(
  entryPoint: string,
  data: Data,
  options: Options = defaultOptions,
) {
  return new Promise<string>((resolve, reject) => {
    try {
      resolve(sprightly(entryPoint, data, options))
    } catch (error) {
      reject(error as string)
    }
  })
}
