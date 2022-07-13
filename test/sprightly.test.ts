import sprightly from "../src/sprightly"

jest.mock("fs/promises", () => {
  const dir: Record<string, string> = {
    "my-name": `my name is {{ myName }}. << ../his-name >>`,
    "../his-name": `his name is {{ hisName }}`,
  }

  return {
    readFile: (filePath: string) => dir[filePath],
  }
})

test("good first test", async () => {
  const doc = await sprightly("my-name", { myName: "Obada", hisName: "Osid" })
  expect(doc).toMatchSnapshot()
})
