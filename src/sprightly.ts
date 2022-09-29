import { readFileSync, existsSync } from "fs"
import path from "path"

interface Data {
  [key: string]: string | number | Array<string | number | Data> | Data
}

interface Options {
  keyFallback?: string
  throwOnKeyNotfound?: boolean
  cache?: boolean
}

function parse(file: string, entryPoint: string, data: Data, options: Options) {
  const parsedFile = file.replaceAll(
    /\{\{(>?)(.*?)\}\}/g,
    (_, isComponent: string, reference: string) => {
      reference = reference.trim()
      if (isComponent) {
        // if last segement of path is a file
        // we go back one step to get the directory of the file
        if (path.extname(entryPoint)) {
          entryPoint = path.normalize(path.join(entryPoint, ".."))
        }

        const componentAbsolutePath = path.resolve(
          entryPoint,
          path.normalize(reference),
        )

        if (!existsSync(componentAbsolutePath)) {
          throw new Error(
            `Component "${reference}" was not found at ${entryPoint}`,
          )
        }

        return sprightly(componentAbsolutePath, data, options)
      }

      const parsedData = reference
        .split(/((?:\w+))(?:(?:\[)(\d+)(?:\]))?(?:\.?)/gm)
        .filter((v) => v?.trim())
        .reduce((obj, key) => {
          key = key.trim()
          if (
            typeof obj === "object" &&
            options.throwOnKeyNotfound &&
            !(key in obj)
          ) {
            throw new Error(`Key "${key}" was not found at ${entryPoint}`)
          }

          return (obj[key] || options.keyFallback) as Data
        }, data)

      if (parsedData && typeof parsedData !== "string") {
        throw new Error(`"${reference}" must yield out a primitve value`)
      }

      return parsedData
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

  try {
    if (!path.isAbsolute(entryPoint)) {
      entryPoint = path.resolve(path.normalize(entryPoint))
    }

    if (!existsSync(entryPoint)) {
      throw new Error(`${entryPoint} was not found`)
    }

    if (options.cache && cache.has(entryPoint)) {
      return cache.get(entryPoint)!
    }

    const file = readFileSync(entryPoint).toString()
    const parsedFile = parse(file, entryPoint, data, options)

    if (options.cache && !cache.has(entryPoint)) {
      cache.set(entryPoint, parsedFile)
    }

    return parsedFile
  } catch (error) {
    throw error
  }
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
      reject((error as Error).message)
    }
  })
}

export = { sprightly, sprightlyAsync }
