import { sprightlyAsync } from "./sprightly"

jest.mock("fs", () => {
  const dir: Record<string, string> = {
    "my-name": `my name is {{ myName }}.\n{{> ../his-name }}`,
    "../his-name": `his name is {{ hisName }}`,
    nested: "my name is {{ name.first }} {{ name.last }}",
    "array-indexing": "my name is {{ name[0] }} {{ name[1] }}",
    "nested-indexing": "{{ property.nested[0].anotherProperty[1] }}",
    "not-found-referenced-component": "{{> ../not-found }}",
  }

  return {
    readFileSync: (filePath: string) => {
      if (filePath in dir) {
        return dir[filePath]
      }
      throw new Error("file not found")
    },
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
