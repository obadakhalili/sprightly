import fs from "fs"
import path from "path"

interface Data {
  [key: string]: string | number | Array<string | number | Data> | Data
}

interface Options {
  keyFallback?: string
  throwOnKeyNotfound?: boolean
  cache?: boolean
}

class SprightlyError extends Error {
  constructor(message: string) {
    super(message)
  }
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

      const keyValue = reference
        .split(/((?:\w+))(?:(?:\[)(\d+)(?:\]))?(?:\.?)/gm)
        .filter((v) => v?.trim())
        .reduce((obj, key) => {
          key = key.trim()
          if (
            typeof obj === "object" &&
            options.throwOnKeyNotfound &&
            !(key in obj)
          ) {
            throw new SprightlyError(
              `Key "${key}" was not found at "${filePath}"`,
            )
          }

          return (obj[key] || options.keyFallback) as Data
        }, data)

      if (typeof keyValue === "object") {
        throw new SprightlyError(
          `"${reference}" must yield out a primitve value`,
        )
      }

      return keyValue
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
      reject(error as SprightlyError)
    }
  })
}

export { sprightly, sprightlyAsync }
