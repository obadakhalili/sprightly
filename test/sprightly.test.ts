import sprightly from "../src/sprightly"

jest.mock("fs/promises", () => {
  const dir: Record<string, string> = {
    "my-name": `my name is {{ myName }}.\n{{> ../his-name }}`,
    "../his-name": `his name is {{ hisName }}`,
    nested: "my name is {{ name.first }} {{ name.last }}",
    "array-indexing": "my name is {{ name[0] }} {{ name[1] }}",
  }

  return {
    readFile: (filePath: string) => dir[filePath],
  }
})

test("good first test", async () => {
  const doc = await sprightly("my-name", { myName: "Obada", hisName: "Osid" })
  expect(doc).toMatchInlineSnapshot(`"sprightly"`)
})

test("if key doesn't exist, then the resolved value should be `keyFallback`'s default value whcih is empty string", async () => {
  const doc = await sprightly("my-name", { hisName: "Osid" })
  expect(doc).toMatchInlineSnapshot(`"sprightly"`)
})

test("if key doesn't exist and the `keyFallback` is set, then the resolved value should be the value set to `keyFallback`", async () => {
  const doc = await sprightly(
    "my-name",
    { hisName: "Osid" },
    { keyFallback: "Obada" },
  )
  expect(doc).toMatchInlineSnapshot(`"sprightly"`)
})

test("if key doesn't exist and the `throwOnKeyNotfound` is set to true, then an error should be thrown", async () => {
  await expect(
    sprightly(
      "key-not-found",
      { hisName: "Osid" },
      { throwOnKeyNotfound: true },
    ),
  ).rejects.toMatchInlineSnapshot(`[Error: sprightly error]`)
})

test("nested properties are resolved correctly", async () => {
  const doc = await sprightly("nested", {
    name: { first: "Obada", last: "Khalili" },
  })
  expect(doc).toMatchInlineSnapshot(`"sprightly"`)
})

test("array indexing is resolved correctly", async () => {
  const doc = await sprightly("array-indexing", {
    name: ["Obada", "Khalili"],
  })
  expect(doc).toMatchInlineSnapshot(`"sprightly"`)
})
