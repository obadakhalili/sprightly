import { Data, Options, sprightlyAsync, SprightlyError } from "../sprightly"

export default function __express(
  path: string,
  options: Data & Options,
  callback: (error: SprightlyError | null, html?: string) => void,
) {
  sprightlyAsync(path, options, {
    cache: options.cache,
    throwOnKeyNotfound: options.throwOnKeyNotfound,
    keyFallback: options.keyFallback,
  })
    .then((html) => callback(null, html))
    .catch(callback)
}
