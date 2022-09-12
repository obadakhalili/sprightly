export default class PathNotFoundError extends Error {
  readonly component: string
  constructor(component: string) {
    super()
    this.component = component
  }
}
