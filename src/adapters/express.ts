import { Options, Data, sprightlyAsync, SprightlyError } from "../sprightly"

type ExpressOptions = Data & { cache: boolean }

// TODO: add unit tests for this adapter
export = function sprightlyExpress(sprightlyOptions: Options = {}) {
  return async function adapter(
    entryPoint: string,
    expressOptions: ExpressOptions,
    callback: (error: SprightlyError | null, html?: string) => void,
  ) {
    try {
      const html = await sprightlyAsync(entryPoint, expressOptions, {
        cache: expressOptions.cache,
        ...sprightlyOptions,
      })
      callback(null, html)
    } catch (error) {
      callback(error as SprightlyError)
    }
  }
}
