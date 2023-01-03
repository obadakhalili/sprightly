import fs from "fs"
import { sprightlyAsync } from "./sprightly"

jest.mock("fs", () => {
  const dir: Record<string, string> = {
    "my-name": `my name is {{ myName }}.\n{{> ../his-name }}`,
    "../his-name": `his name is {{ hisName }}`,
    nested: "my name is {{ name.first }} {{ name.last }}",
    "array-indexing": "my name is {{ name.0 }} {{ name.1 }}",
    "nested-indexing": "{{ property.nested.0.anotherProperty.1 }}",
    "yielding-non-strings-and-numbers":
      "{{ object }}, {{ array }}, {{ bool }}, {{ null }}, {{ undefined }}, {{ function }}",
    "not-found-referenced-component": "{{> ../not-found }}",
  }

  return {
    readFileSync: jest.fn((filePath: string) => {
      if (filePath in dir) {
        return dir[filePath]
      }
      throw new Error("file not found")
    }),
    existsSync: (filePath: string) => filePath in dir,
  }
})

jest.mock("path", () => {
  return {
    ...jest.requireActual("path"),
    isAbsolute: () => true,
    dirname: () => "",
    normalize: (filePath: string) => filePath,
  }
})

test("good first test", async () => {
  const doc = await sprightlyAsync("my-name", {
    myName: "Obada",
    hisName: "Osid",
  })
  expect(doc).toMatchInlineSnapshot(`
    "my name is Obada.
    his name is Osid"
  `)
})

test("if wrong arguments types are passed, then an error should be thrown", async () => {
  await expect(
    sprightlyAsync([] as any, {}),
  ).rejects.toThrowErrorMatchingInlineSnapshot(`"Entry point must be a string"`)

  await expect(
    sprightlyAsync("my-name", new Map() as any),
  ).rejects.toThrowErrorMatchingInlineSnapshot(`"Data must be an object"`)

  await expect(
    sprightlyAsync("my-name", {}, 123 as any),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"Options must be an object or undefined"`,
  )
})

test("if key doesn't exist, then the resolved value should be `keyFallback`'s default value whcih is empty string", async () => {
  const doc = await sprightlyAsync("my-name", { hisName: "Osid" })
  expect(doc).toMatchInlineSnapshot(`
    "my name is .
    his name is Osid"
  `)
})

test("if key doesn't exist and the `keyFallback` is set, then the resolved value should be the value set to `keyFallback`", async () => {
  const doc = await sprightlyAsync(
    "my-name",
    { hisName: "Osid" },
    { keyFallback: "Obada" },
  )
  expect(doc).toMatchInlineSnapshot(`
    "my name is Obada.
    his name is Osid"
  `)
})

test("if key doesn't exist and the `throwOnKeyNotfound` is set to true, then an error should be thrown", async () => {
  await expect(
    sprightlyAsync(
      "my-name",
      { hisName: "Osid" },
      { throwOnKeyNotfound: true },
    ),
  ).rejects.toMatchInlineSnapshot(
    `[Error: Key "myName" was not found at "my-name"]`,
  )
})

test("nested properties are resolved correctly", async () => {
  const doc = await sprightlyAsync("nested", {
    name: { first: "Obada", last: "Khalili" },
  })
  expect(doc).toMatchInlineSnapshot(`"my name is Obada Khalili"`)
})

test("array indexing is resolved correctly", async () => {
  const doc = await sprightlyAsync("array-indexing", {
    name: ["Obada", "Khalili"],
  })
  expect(doc).toMatchInlineSnapshot(`"my name is Obada Khalili"`)
})

test("yielded values other than strings and numbers are stringified", async () => {
  const doc = await sprightlyAsync("yielding-non-strings-and-numbers", {
    object: { a: 1 },
    array: [1, 2, {}],
    bool: true,
    null: null,
    undefined: undefined,
    function: (a: number, b: number) => a + b,
  } as any)
  expect(doc).toMatchInlineSnapshot(
    `"[object Object], 1,2,[object Object], true, null, undefined, (a, b) => a + b"`,
  )
})

test("throws if entry point not found", async () => {
  await expect(sprightlyAsync("not-found", {})).rejects.toMatchInlineSnapshot(
    `[Error: Entry point "not-found" does not exist]`,
  )
})

test("throws if component not found", async () => {
  await expect(
    sprightlyAsync("not-found-referenced-component", {}),
  ).rejects.toMatchInlineSnapshot(
    `[Error: Component "../not-found" was not found at "not-found-referenced-component"]`,
  )
})

test("deep nested properties and array indexing are resolved correctly", async () => {
  const doc = await sprightlyAsync("nested-indexing", {
    property: {
      nested: [{ anotherProperty: ["Obada", "Khalili"] }],
    },
  })
  expect(doc).toMatchInlineSnapshot(`"Khalili"`)
})

describe("cache tests", () => {
  test("expect file to be read twice if cache is disabled", async () => {
    const readFilesCount = jest.mocked(fs).readFileSync.mock.calls.length
    const options = { cache: false }

    await sprightlyAsync("../his-name", {}, options)
    expect(fs.readFileSync).toHaveBeenCalledTimes(readFilesCount + 1)

    await sprightlyAsync("../his-name", {}, options)
    expect(fs.readFileSync).toHaveBeenCalledTimes(readFilesCount + 2)
  })

  test("expect file to not be read twice if cache is enabled", async () => {
    const readFilesCount = jest.mocked(fs).readFileSync.mock.calls.length
    const options = { cache: true }

    await sprightlyAsync("../his-name", {}, options)
    expect(fs.readFileSync).toHaveBeenCalledTimes(readFilesCount + 1)

    await sprightlyAsync("../his-name", {}, options)
    expect(fs.readFileSync).toHaveBeenCalledTimes(readFilesCount + 1)
  })
})
