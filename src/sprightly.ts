import fs from "fs"
import path from "path"

import get from "get-value"

class SprightlyError extends Error {
  constructor(message: string) {
    super(message)
  }
}

interface Data {
  [key: string]: string | number | Array<string | number | Data> | Data
}

interface Options {
  keyFallback?: string
  throwOnKeyNotfound?: boolean
  cache?: boolean
}

function parse(
  fileContent: string,
  filePath: string,
  data: Data,
  options: Options,
) {
  const parsedFile = fileContent.replaceAll(
    /\{\{(>?)(.*?)\}\}/g,
    (_, isComponent: string, reference: string) => {
      reference = reference.trim()

      if (isComponent) {
        const componentAbsolutePath = path.join(
          path.dirname(filePath),
          path.normalize(reference),
        )

        if (!fs.existsSync(componentAbsolutePath)) {
          throw new SprightlyError(
            `Component "${reference}" was not found at "${filePath}"`,
          )
        }

        return sprightly(componentAbsolutePath, data, options)
      }

      const value = get(
        data,
        reference,
        options.throwOnKeyNotfound ? undefined : options.keyFallback,
      )

      if (value === undefined && options.throwOnKeyNotfound) {
        throw new SprightlyError(
          `Key "${reference}" was not found at "${filePath}"`,
        )
      }

      return value
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
  if (typeof entryPoint !== "string") {
    throw new SprightlyError("Entry point must be a string")
  }

  if (data.constructor !== Object) {
    throw new SprightlyError("Data must be an object")
  }

  if (options.constructor !== Object) {
    throw new SprightlyError("Options must be an object or undefined")
  }

  options = {
    ...defaultOptions,
    ...options,
  }

  if (!path.isAbsolute(entryPoint)) {
    entryPoint = path.resolve(path.normalize(entryPoint))
  }

  if (!fs.existsSync(entryPoint)) {
    throw new SprightlyError(`Entry point "${entryPoint}" does not exist`)
  }

  if (options.cache && cache.has(entryPoint)) {
    return cache.get(entryPoint)!
  }

  const file = fs.readFileSync(entryPoint).toString()
  const parsedFile = parse(file, entryPoint, data, options)

  if (options.cache && !cache.has(entryPoint)) {
    cache.set(entryPoint, parsedFile)
  }

  return parsedFile
}

function sprightlyAsync(
  entryPoint: string,
  data: Data,
  options: Options = defaultOptions,
) {
  return new Promise<string>((resolve, reject) => {
    try {
      resolve(sprightly(entryPoint, data, options))
    } catch (error) {
      reject(error)
    }
  })
}

sprightly.__express = (
  path: string,
  data: Data,
  callback: Function,
  options?: Options,
) => {
  try {
    return callback(null, sprightly(path, data, options))
  } catch (error) {
    callback(error)
  }
}

export { sprightly, sprightlyAsync }
