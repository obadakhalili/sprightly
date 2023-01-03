Template engines like EJS and Handlebars are good. But sometimes, you don't want all the code and the complexity that comes with them. You only want a simple variables injection with components support. Well, that is what Sprightly is for, it is a one-filer that lets you use those tiny features without having to include or think about anything else.

# Guide and APIs

When you `import * as APIs from "sprightly"` you get access to the following APIs:

- `sprightly`.

  The template engine function.
  Interface:

  ```tsx
  function sprightly(entryPoint: string, data: Data, options?: Options): string
  ```

  Given an `entryPoint`, the function will return the file injected with the variables referenced in `data`. The function also receives an `options` argument containing an object of options to modify the function’s behavior.
  Example:

  ```html
  <!-- ./nested/file.html -->

  {{ name }} says {{> ../message.html }}.
  ```

  ```html
  <!-- ./message.html -->

  Hi
  ```

  Notes:

  - `{{ var }}` is the syntax for referencing a variable.
  - `{{> ./path/to/file }}` is the syntax for referencing a component.

  ```tsx
  sprightly("./nested/file.html", { cool: "Osid" })
  // => "Osid says Hi".
  ```

- `sprightlyAsync`.

  A promisifed version of the `sprightly` function described above.

- `Data`.

  The interface for the `data` parameter defind in `sprightly`'s function.

  ```tsx
  interface Data {
    [key: string]: string | number | Array<string | number | Data> | Data
  }
  ```

  The `key` is the name of the variable referenced in the template. It can hold a string, a number, a recuresive `Data` object, or an array of all of the mentioned types. This means that the template can use subscripting syntax to reference deeply nested variables. Example:

  ```tsx
  const data = {
    property: {
      nested: [{ anotherProperty: ["foo", "bar"] }],
    },
  }

  sprightly("./file.html", data)
  // => "bar"
  ```

  In template:

  ```
  <!-- ./file.html -->

  {{ property.nested.0.anotherProperty.1 }}
  ```

  The solution used for the subscribting logic is [get-value](https://www.npmjs.com/package/get-value). Its syntax is simple, but you can visit its page if you want to inspect it more thouroughly.

- `Options`.

  The interface for the `options` parameter defind in `sprightly`'s function.

  ```tsx
  interface Options {
    keyFallback?: string
    throwOnKeyNotfound?: boolean
    cache?: boolean
  }
  ```

  | Option               | Default                                                                                                                                                        | Description                                                                                                                                         |
  | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `throwOnKeyNotFound` | `false`                                                                                                                                                        | Determines whether to throw an error if a referenced variable isn’t found.                                                                          |
  | `keyFallback`        | empty string                                                                                                                                                   | Contains the value to be used if a referenced variable doesn’t exist. Doesn’t matter if `throwOnKeyNotFound` is set to `true`.                      |
  | `cache`              | If available, it is set to the `cache` value sent through Express’s options that comes from `app.set("view cache", truthValue)`, if not, it is set to `false`. | Determines whether to cache processed entry points or not. Typically you would want to set this to `true` in production and `false` in development. |

- `SprightlyError`.

  The error class thrown by the `sprightly` function. Occusions that the error is thrown at:

  - If the passed `entryPoint` argument isn’t a string.
  - If the passed `data` argument isn’t an object.
  - If the passed `options` argument isn’t an object.
  - If the passed `entryPoint` doesn’t exist.
  - If a referenced variable isn’t found. Triggered only if `throwOnKeyNotFound` is set to `true`.
  - If a referenced component isn’t found.

# Usage with ExpressJS

```tsx
// to import the Express adapter
import sprightlyExpress from "sprightly/express"

/* This sets up the template engine.
 * Express by default requires and calls the necessary template engine according to
 * the extension of the file to render (e.g. .hbs). But because sprightly has no specific
 * file extension to allow it to be used with any file, you have to set this up manually.
 */
app.engine(
  "html",
  sprightlyExpress({
    cache: false,
    keyFallback: "obada",
    throwOnKeyNotfound: false,
  }),
)

app.get("/", (_, res) => {
  res.render("./nested/file.html", { cool: "sprightly" })
})
```
