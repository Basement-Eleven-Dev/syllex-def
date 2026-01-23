import { getNovaResponse } from "../src/_helpers/_ai-aws/assistant.service";

describe("placeholder", () => {
  test("should pass this placeholder test", async () => {
    let res = await getNovaResponse('ciao', 'come va?')
    expect(true).toBe(true);
  });
});
