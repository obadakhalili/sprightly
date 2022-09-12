export default class KeyNotFoundError extends Error {
  readonly key: string
  constructor(key: string) {
    super()
    this.key = key
  }
}
